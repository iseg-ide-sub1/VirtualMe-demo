import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as LogItem from './log-item'

let logs: LogItem.LogItem[] = []
let startTime: string = ""
let snapshot: string = ""
let editTimeout: NodeJS.Timeout | undefined
let pendingChanges: vscode.TextDocumentContentChangeEvent[] = []
let lastEditTime: number = 0

export function activate(context: vscode.ExtensionContext) {
	startTime = getFormattedTime1()

	/** 注册命令：virtualme-demo.virtuame */
	const disposable = vscode.commands.registerCommand('virtualme-demo.virtualme', () => {
		vscode.window.showInformationMessage('Thanks for using VirtualME Demo!')
	})
	context.subscriptions.push(disposable)

	/** 打开文件 */
	const openTextDocumentWatcher = vscode.workspace.onDidOpenTextDocument(doc => {
		const artifact = new LogItem.ArtiFact(doc.uri.toString(), LogItem.ArtiFactType.File)
		const openTextDocumentLog = new LogItem.OpenTextDocumentLog(artifact)
		logs.push(openTextDocumentLog)
		console.log(openTextDocumentLog.toString())

	})
	context.subscriptions.push(openTextDocumentWatcher)

	/** 关闭文件 */
	const closeTextDocumentWatcher = vscode.workspace.onDidCloseTextDocument(doc => {
		const artifact = new LogItem.ArtiFact(doc.uri.toString(), LogItem.ArtiFactType.File)
		const closeTextDocumentLog = new LogItem.CloseTextDocumentLog(artifact)
		logs.push(closeTextDocumentLog)
		console.log(closeTextDocumentLog.toString())
	})
	context.subscriptions.push(closeTextDocumentWatcher)

	/** 切换当前文件 */
	const changeActiveTextDocumentWatcher = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			const artifact = new LogItem.ArtiFact(editor.document.uri.toString(), LogItem.ArtiFactType.File)
			const changeActiveTextDocumentLog = new LogItem.ChangeActiveTextDocumentLog(artifact)
			logs.push(changeActiveTextDocumentLog)
			console.log(changeActiveTextDocumentLog.toString())
		}
	})
	context.subscriptions.push(changeActiveTextDocumentWatcher)

	/** 用光标选择文本内容 */
    // 仅仅移动光标，也会触发此事件
	const selectTextWatcher = vscode.window.onDidChangeTextEditorSelection(async event => {
		const selection = event.selections[0]
		// 只有当真正选择了文本时才记录
		if (!selection.isEmpty) {
			const start = selection.start
			const artifact = await getArtifactFromSymbolHierarchy(event.textEditor.document, start)
			// 添加选择的文本内容到上下文
			if (!artifact.context) {
				artifact.context = {}
			}
			artifact.context.selection = {
				text: event.textEditor.document.getText(selection),
				range: {
					start: { line: selection.start.line + 1, character: selection.start.character + 1 },
					end: { line: selection.end.line + 1, character: selection.end.character + 1 }
				}
			}
			const selectTextLog = new LogItem.SelectTextLog(artifact)
			logs.push(selectTextLog)
			console.log(selectTextLog.toString())
		}
	})
	context.subscriptions.push(selectTextWatcher)

	/** 修改文件内容(新增、删除、修改、Redo、Undo) */
	const changeTextDocumentWatcher = vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
        const now = Date.now()
        
        // 增加合并时间窗口到1000ms
        if (now - lastEditTime < 1000) {
            pendingChanges.push(...event.contentChanges)
            lastEditTime = now
            return
        }
        
        // 处理待处理的更改
        if (pendingChanges.length > 0) {
            pendingChanges.push(...event.contentChanges)
            await handleMergedChanges(event.document, pendingChanges)
            pendingChanges = []
        } else if (event.contentChanges.length > 0) { // 只处理非空的更改
            await handleMergedChanges(event.document, event.contentChanges)
        }
        
        lastEditTime = now
	})
	context.subscriptions.push(changeTextDocumentWatcher)

	async function handleMergedChanges(document: vscode.TextDocument, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
        // 如果只有一个变更，直接处理
        if (changes.length === 1) {
            const change = changes[0];
            const changeEvent: vscode.TextDocumentChangeEvent = {
                document: document,
                contentChanges: changes,
                reason: undefined
            };
            await handleSingleChange(document, change, changeEvent);
            return;
        }

        // 对于多个变更，需要考虑它们的位置关系
        let firstChange = changes[0];
        let lastChange = changes[changes.length - 1];
        
        // 计算完整的变更范围
        const range = new vscode.Range(
            firstChange.range.start,
            lastChange.range.end
        );
        
        // 获取变更前的完整内容
        const oldContent = document.getText(range);
        
        // 获取变更后的完整内容
        // 需要按照正确的顺序应用所有变更
        let newContent = '';
        let lastPos = firstChange.range.start;
        
        for (const change of changes) {
            // 添加从上一个变更位置到当前变更位置之间的未修改内容
            if (change.range.start.line > lastPos.line || 
                (change.range.start.line === lastPos.line && change.range.start.character > lastPos.character)) {
                const intermediatRange = new vscode.Range(lastPos, change.range.start);
                newContent += document.getText(intermediatRange);
            }
            // 添加当前变更的新内容
            newContent += change.text;
            lastPos = change.range.end;
        }

        // 创建合并后的变更对象
        const mergedChange = {
            range: range,
            rangeOffset: document.offsetAt(range.start),
            rangeLength: document.offsetAt(range.end) - document.offsetAt(range.start),
            text: newContent
        } as vscode.TextDocumentContentChangeEvent;

        const changeEvent: vscode.TextDocumentChangeEvent = {
            document: document,
            contentChanges: [mergedChange],
            reason: undefined
        };

        await handleSingleChange(document, mergedChange, changeEvent);
    }

    // 处理单个变更的辅助函数
    async function handleSingleChange(
        document: vscode.TextDocument, 
        change: vscode.TextDocumentContentChangeEvent,
        changeEvent: vscode.TextDocumentChangeEvent
    ) {
        const changeType = getTextDocChangeType(changeEvent)
        const changePosition = change.range.start
        
        // 忽略空的更改
        if (change.text.length === 0 && change.range.isEmpty) {
            return
        }
        
        // 获取完整的上下文
        const artifact = await getArtifactFromSymbolHierarchy(document, changePosition)
        
        // 确保上下文信息完整
        if (!artifact.context) {
            artifact.context = {}
        }
        
        // 获取更准确的变更内容
        const oldContent = document.getText(change.range)
        const newContent = change.text
        
        // 只记录实际发生变化的内容
        if (oldContent === newContent) {
            return
        }
        
        artifact.context.change = {
            type: changeType,
            content: {
                before: oldContent,
                after: newContent
            },
            length: {
                before: oldContent.length,
                after: newContent.length
            }
        }
        
        // 创建日志对象
        let logItem: LogItem.LogItem
        
        if (changeType === LogItem.ChangeType.Add && newContent.length > 0) {
            logItem = new LogItem.AddTextDocumentLog(
                artifact,
                newContent.length,
                newContent
            )
        } else if (changeType === LogItem.ChangeType.Delete && oldContent.length > 0) {
            logItem = new LogItem.DeleteTextDocumentLog(
                artifact,
                oldContent.length,
                oldContent
            )
        } else if (changeType === LogItem.ChangeType.Edit && 
                   (oldContent !== newContent)) {
            logItem = new LogItem.EditTextDocumentLog(
                artifact,
                oldContent,
                newContent
            )
        } else {
            return // 忽略无效的变更
        }
        
        logs.push(logItem)
        console.log(logItem.toString())
    }

	/** 新建终端 */
	const openTerminalWatcher = vscode.window.onDidOpenTerminal(async terminal => {
		const artifact = new LogItem.ArtiFact(terminal.name, LogItem.ArtiFactType.Terminal)
		const processId = await getProcessId(terminal.processId)
		const openTerminalLog = new LogItem.OpenTerminalLog(artifact, processId)
		logs.push(openTerminalLog)
		console.log(openTerminalLog.toString())
	})
	context.subscriptions.push(openTerminalWatcher)

	/** 关闭终端 */
	const closeTerminalWatcher = vscode.window.onDidCloseTerminal(async terminal => {
		const artifact = new LogItem.ArtiFact(terminal.name, LogItem.ArtiFactType.Terminal)
		const processId = await getProcessId(terminal.processId)
		const closeTerminalLog = new LogItem.CloseTerminalLog(artifact, processId)
		logs.push(closeTerminalLog)
		console.log(closeTerminalLog.toString())
	})
	context.subscriptions.push(closeTerminalWatcher)

	/** 切换活动终端 */
	const changeActiveTerminalWatcher = vscode.window.onDidChangeActiveTerminal(async terminal => {
		if (!terminal) {
			return
		}
		const artifact = new LogItem.ArtiFact(terminal.name, LogItem.ArtiFactType.Terminal)
		const processId = await getProcessId(terminal.processId)
		const changeActiveTerminalLog = new LogItem.ChangeActiveTerminalLog(artifact, processId)
		logs.push(changeActiveTerminalLog)
		console.log(changeActiveTerminalLog.toString())
	})
	context.subscriptions.push(changeActiveTerminalWatcher)
 
	if (vscode.workspace.workspaceFolders) {
		const filesWatcher = vscode.workspace.createFileSystemWatcher('**/*')
		/** 文件保存 */
        filesWatcher.onDidChange(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const saveFileLog = new LogItem.SaveFileLog(artifact)
			logs.push(saveFileLog)
			console.log(saveFileLog.toString())
        })

		/** 文件创建 */
        filesWatcher.onDidCreate(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const createFile = new LogItem.CreateFileLog(artifact)
			logs.push(createFile)
			console.log(createFile.toString())
        })

		/** 文件删除 */
        filesWatcher.onDidDelete(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const deleteFile = new LogItem.DeleteFileLog(artifact)
			logs.push(deleteFile)
			console.log(deleteFile.toString())
        })


	} else {
		vscode.window.showInformationMessage('No workspace folders are open.')
	}

	/** 注册命令：保存日志 */
	const saveLogCommand = vscode.commands.registerCommand('virtualme-demo.savelog', () => {
		saveLogToFile()
		vscode.window.showInformationMessage('Log file has been saved!')
	})
	context.subscriptions.push(saveLogCommand)
}

// 将保存日志的逻辑抽取为单独的函数，这样可以在 deactivate 和快捷键命令中复用
function saveLogToFile() {
	const extensionPath = path.join(__dirname, '..')
	const logDirectory = path.join(extensionPath, 'log')
	
	if (!fs.existsSync(logDirectory)) {
		fs.mkdirSync(logDirectory, { recursive: true })
	}
	
	const fileName = startTime + '.json'
	const filePath = path.join(logDirectory, fileName)
	
	try {
		const logsJson = JSON.stringify(logs, (key, value) => {
			if (value instanceof Map) {
				const obj: { [key: string]: any } = {}
				value.forEach((v, k) => {
					obj[k] = v
				})
				return obj
			}
			return value
		}, 2)
		
		fs.writeFileSync(filePath, logsJson, 'utf8')
		console.log(`Log file saved to: ${filePath}`)
	} catch (error) {
		console.error('Error saving log file:', error)
		vscode.window.showErrorMessage('Failed to save log file: ' + error)
	}
}

export function deactivate() {
	saveLogToFile()
}

/**
 * 获取格式化的当前时间字符串，包括年月日时分秒和毫秒。
 * @returns {string} 格式化的当前时间。
 */
function getFormattedTime() {
	const now = new Date()
	// 获取年月日小时分钟秒和毫秒
	const year = now.getFullYear()
	const month = now.getMonth() + 1 // getMonth() 返回的月份从0开始，所以需要加1
	const day = now.getDate()
	const hours = now.getHours()
	const minutes = now.getMinutes()
	const seconds = now.getSeconds()
	const milliseconds = now.getMilliseconds()
  
	// 格式化月份、日期、小时、分钟、秒和毫秒，不足两位数的前面补零
	const formattedMonth = month.toString().padStart(2, '0')
	const formattedDay = day.toString().padStart(2, '0')
	const formattedHours = hours.toString().padStart(2, '0')
	const formattedMinutes = minutes.toString().padStart(2, '0')
	const formattedSeconds = seconds.toString().padStart(2, '0')
	const formattedMilliseconds = milliseconds.toString().padStart(3, '0')
  
	// 组合成最终的字符串
	const formattedTime = `${year}-${formattedMonth}-${formattedDay} ${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`
	return formattedTime
}

/**
 * 获取格式化的当前时间字符串，包括年月日时分秒。
 * @returns {string} 格式化的当前时间。
 */
function getFormattedTime1() {
	const now = new Date()
	// 获取年月日小时分钟秒和毫秒
	const year = now.getFullYear()
	const month = now.getMonth() + 1 // getMonth() 返回的月份从0开始，所以需要加1
	const day = now.getDate()
	const hours = now.getHours()
	const minutes = now.getMinutes()
	const seconds = now.getSeconds()
  
	// 格式化月份、日期、小时、分钟、秒和毫秒，不足两位数的前面补零
	const formattedMonth = month.toString().padStart(2, '0')
	const formattedDay = day.toString().padStart(2, '0')
	const formattedHours = hours.toString().padStart(2, '0')
	const formattedMinutes = minutes.toString().padStart(2, '0')
	const formattedSeconds = seconds.toString().padStart(2, '0')
  
	// 组合成最终的字符串
	const formattedTime = `${year}-${formattedMonth}-${formattedDay}.${formattedHours}.${formattedMinutes}.${formattedSeconds}`
	return formattedTime
}


/**
 * 根据给定的位置获取符号层级，并创建一个 Artifact 对象。
 * @param document 当前文本文档。
 * @param position 文档中的位置。
 * @returns 一个 LogItem.ArtiFact 对象，包含符号层级信息。
 */
async function getArtifactFromSymbolHierarchy(document: vscode.TextDocument, position: vscode.Position): Promise<LogItem.ArtiFact> {
    const symbolHierarchy = await getSymbolHierarchyAtPosition(document, position)
    let hierarchys: LogItem.ArtiFact[] = []
    let name: string = document.uri.toString()
    let type: LogItem.ArtiFactType = LogItem.ArtiFactType.File

    // 创建简化的作用域上下文结构
    let scopeContext = {
        position: {
            line: position.line + 1,
            character: position.character + 1
        },
        scope: {
            file: {
                name: path.basename(document.uri.fsPath),
                path: document.uri.fsPath
            },
            class: undefined as { name: string; } | undefined,
            method: undefined as { name: string; } | undefined
        }
    }

    // 将文档作为最顶层的 Artifact
    const fileArtifact = new LogItem.ArtiFact(
        document.uri.toString(), 
        LogItem.ArtiFactType.File,
        undefined,
        scopeContext
    )
    hierarchys.push(fileArtifact)

    if (symbolHierarchy && symbolHierarchy.length > 0) {
        for (const symbol of symbolHierarchy) {
            const symbolContext = { ...scopeContext }
            
            // 只记录符号名称
            if (symbol.kind === vscode.SymbolKind.Class) {
                symbolContext.scope.class = {
                    name: symbol.name
                }
            } else if (symbol.kind === vscode.SymbolKind.Method || 
                      symbol.kind === vscode.SymbolKind.Function) {
                symbolContext.scope.method = {
                    name: symbol.name
                }
            }

            const h = new LogItem.ArtiFact(
                symbol.name, 
                getSymbolKindDescription(symbol.kind),
                undefined,
                symbolContext
            )
            hierarchys.push(h)
        }
        
        name = hierarchys[hierarchys.length - 1].name
        type = hierarchys[hierarchys.length - 1].type
    }

    const artifact = new LogItem.ArtiFact(name, type, hierarchys)
    return artifact
}

/**
 * 获取指定文档中特定位置的符号层级链。
 * @param document 要查询的文档。
 * @param position 文档中的特定位置。
 * @returns 一个包含符号层级链的 Promise，类型为 vscode.DocumentSymbol[] 或 undefined。
 */
async function getSymbolHierarchyAtPosition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.DocumentSymbol[] | undefined> {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider', document.uri
    )
    if (!symbols) {
        return undefined
    }

    return findSymbolHierarchyAtPosition(symbols, position)
}

/**
 * 递归查找符号层级链，从文件级到最小符号。
 * @param symbols 文档中的符号数组。
 * @param position 文档中的特定位置。
 * @returns 一个包含符号层级链的数组，类型为 vscode.DocumentSymbol[] 或 undefined。
 */
function findSymbolHierarchyAtPosition(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol[] | undefined {
    for (const symbol of symbols) {
        if (symbol.range.contains(position)) {
            if (symbol.children.length > 0) {
                const childHierarchy = findSymbolHierarchyAtPosition(symbol.children, position)
                if (childHierarchy) {
                    return [symbol, ...childHierarchy]
                }
            }
            return [symbol]
        }
    }
    return undefined
}

/**
 * 将 SymbolKind 枚举值转换为对应的 ArtiFactType 枚举描述。
 * @param kind SymbolKind 枚举值。
 * @returns 对应的 ArtiFactType 枚举值。
 */
function getSymbolKindDescription(kind: vscode.SymbolKind): LogItem.ArtiFactType {
    switch (kind) {
        case vscode.SymbolKind.File:
            return LogItem.ArtiFactType.File
        case vscode.SymbolKind.Module:
            return LogItem.ArtiFactType.Module
        case vscode.SymbolKind.Namespace:
            return LogItem.ArtiFactType.Namespace
        case vscode.SymbolKind.Package:
            return LogItem.ArtiFactType.Package
        case vscode.SymbolKind.Class:
            return LogItem.ArtiFactType.Class
        case vscode.SymbolKind.Method:
            return LogItem.ArtiFactType.Method
        case vscode.SymbolKind.Property:
            return LogItem.ArtiFactType.Property
        case vscode.SymbolKind.Field:
            return LogItem.ArtiFactType.Field
        case vscode.SymbolKind.Constructor:
            return LogItem.ArtiFactType.Constructor
        case vscode.SymbolKind.Enum:
            return LogItem.ArtiFactType.Enum
        case vscode.SymbolKind.Interface:
            return LogItem.ArtiFactType.Interface
        case vscode.SymbolKind.Function:
            return LogItem.ArtiFactType.Function
        case vscode.SymbolKind.Variable:
            return LogItem.ArtiFactType.Variable
        case vscode.SymbolKind.Constant:
            return LogItem.ArtiFactType.Constant
        case vscode.SymbolKind.String:
            return LogItem.ArtiFactType.String
        case vscode.SymbolKind.Number:
            return LogItem.ArtiFactType.Number
        case vscode.SymbolKind.Boolean:
            return LogItem.ArtiFactType.Boolean
        case vscode.SymbolKind.Array:
            return LogItem.ArtiFactType.Array
        case vscode.SymbolKind.Object:
            return LogItem.ArtiFactType.Object
        case vscode.SymbolKind.Key:
            return LogItem.ArtiFactType.Key
        case vscode.SymbolKind.Null:
            return LogItem.ArtiFactType.Null
        case vscode.SymbolKind.EnumMember:
            return LogItem.ArtiFactType.EnumMember
        case vscode.SymbolKind.Struct:
            return LogItem.ArtiFactType.Struct
        case vscode.SymbolKind.Event:
            return LogItem.ArtiFactType.Event
        case vscode.SymbolKind.Operator:
            return LogItem.ArtiFactType.Operator
        case vscode.SymbolKind.TypeParameter:
            return LogItem.ArtiFactType.TypeParameter
        default:
            return LogItem.ArtiFactType.Unknown
    }
}

/**
 * 分析文本更改事件并记录更改类型。
 * @param event 文本更改事件。
 */
function getTextDocChangeType(event: vscode.TextDocumentChangeEvent): LogItem.ChangeType {
	const originalText = event.document.getText()
    for (const change of event.contentChanges) {
        const { text, range, rangeOffset, rangeLength } = change
		console.log(text)
		console.log(range)
		console.log(rangeOffset)
		console.log(rangeLength)
		
		if (event.reason === vscode.TextDocumentChangeReason.Undo) {
			console.log('撤销操作')
			return LogItem.ChangeType.Undo
		} else if (event.reason === vscode.TextDocumentChangeReason.Redo) {
			console.log('重做操作')
			return LogItem.ChangeType.Redo
		} else {
			if (text.length === 0) {
				console.log('删除代码')
				return LogItem.ChangeType.Delete
			} else if (event.document.getText(range).length === 0) {
				console.log(`新增代码: ${text}, 位于第 ${range.start.line + 1} 行`)
				return LogItem.ChangeType.Add
			} else {
				console.log('修改代码')
				return LogItem.ChangeType.Edit
			}
		}    
    }
	return LogItem.ChangeType.Unknown
}

// 使用 async/await 等待异步操作完成
async function getProcessId(processId: Thenable<number | undefined>): Promise<number> {
    const pid = await processId 
    if (pid !== undefined) {
        return pid
    } else {
        return -1
    }
}

