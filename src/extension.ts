import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as LogItem from './log-item'

let logs: LogItem.LogItem[] = []
let startTime = ""

export function activate(context: vscode.ExtensionContext) {
	startTime = getFormattedTime1()

	/** 注册命令：virtualme-demo.virtuame */
	const disposable = vscode.commands.registerCommand('virtualme-demo.virtualme', () => {
		vscode.window.showInformationMessage('Thanks for using VirtualME Demo!')
	})
	context.subscriptions.push(disposable)

	const openTextDocumentWatcher = vscode.workspace.onDidOpenTextDocument(doc => {
		const artifact = new LogItem.ArtiFact(doc.uri.toString(), LogItem.ArtiFactType.File)
		const openTextDocumentLog = new LogItem.OpenTextDocumentLog(artifact)
		logs.push(openTextDocumentLog)
		openTextDocumentLog.output2console()
	})
	context.subscriptions.push(openTextDocumentWatcher)

	const closeTextDocumentWatcher = vscode.workspace.onDidCloseTextDocument(doc => {
		const artifact = new LogItem.ArtiFact(doc.uri.toString(), LogItem.ArtiFactType.File)
		const closeTextDocumentLog = new LogItem.CloseTextDocumentLog(artifact)
		logs.push(closeTextDocumentLog)
		closeTextDocumentLog.output2console()
	})
	context.subscriptions.push(closeTextDocumentWatcher)

	const changeTextDocumentWatcher = vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
        const changeType = analyzeTextEdit(event)
		const changePosition = event.contentChanges[0]?.range.start
        if (!changePosition) {
            console.log("No change position found.")
            return
        }
        const symbolHierarchy = await getSymbolHierarchyAtPosition(event.document, changePosition)
		let hierarchys: LogItem.ArtiFact[] = []
		let name: string = event.document.uri.toString()
		let type: LogItem.ArtiFactType = LogItem.ArtiFactType.File
		hierarchys.push(new LogItem.ArtiFact(event.document.uri.toString(), LogItem.ArtiFactType.File))
        if (symbolHierarchy && symbolHierarchy.length > 0) {
			for (let symbol of symbolHierarchy) {
				console.log("name: ", symbol.name, "   detail: ", symbol.detail, "   kind: ", symbol.kind, "   start: ", symbol.range.start, "   end: ", symbol.range.end)
				if (symbol.tags) {
					console.log("tags: ")
					for (let tag of symbol.tags) {
						console.log(tag)
					}
				}
				console.log("childrens: ")
				for (let children of symbol.children) {
					console.log(children.name)
				}
				
				const h = new LogItem.ArtiFact(symbol.name, getSymbolKindDescription(symbol.kind))
				hierarchys.push(h)
			}
			name = hierarchys[hierarchys.length - 1].name
			type = hierarchys[hierarchys.length - 1].type
        }

		const artifact = new LogItem.ArtiFact(name, type, hierarchys)
		let changeTextDocumentLog
		if (changeType === LogItem.ChangeType.Add) {
			changeTextDocumentLog = new LogItem.AddTextDocumentLog(artifact)
			logs.push(changeTextDocumentLog)
			changeTextDocumentLog.output2console()
		} else if (changeType === LogItem.ChangeType.Delete) {
			changeTextDocumentLog = new LogItem.DeleteTextDocumentLog(artifact)
			logs.push(changeTextDocumentLog)
			changeTextDocumentLog.output2console()
		} else if (changeType === LogItem.ChangeType.Edit) {
			changeTextDocumentLog = new LogItem.EditTextDocumentLog(artifact)
			logs.push(changeTextDocumentLog)
			changeTextDocumentLog.output2console()
		} else if (changeType === LogItem.ChangeType.Redo) {
			changeTextDocumentLog = new LogItem.RedoTextDocumentLog(artifact)
			logs.push(changeTextDocumentLog)
			changeTextDocumentLog.output2console()
		} else if (changeType === LogItem.ChangeType.Undo) {
			changeTextDocumentLog = new LogItem.UndoTextDocumentLog(artifact)
			logs.push(changeTextDocumentLog)
			changeTextDocumentLog.output2console()
		}
		
		// console.log(`          reason: ${event.reason}`)
	})
	context.subscriptions.push(changeTextDocumentWatcher)
 
	if (vscode.workspace.workspaceFolders) {
		const filesWatcher = vscode.workspace.createFileSystemWatcher('**/*')
		// 监听文件保存事件
        filesWatcher.onDidChange(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const saveFileLog = new LogItem.SaveFileLog(artifact)
			logs.push(saveFileLog)
			saveFileLog.output2console()
        })

        // 监听文件创建事件
        filesWatcher.onDidCreate(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const createFile = new LogItem.CreateFileLog(artifact)
			logs.push(createFile)
			createFile.output2console()
        })

        // 监听文件删除事件
        filesWatcher.onDidDelete(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const deleteFile = new LogItem.DeleteFileLog(artifact)
			logs.push(deleteFile)
			deleteFile.output2console()
        })


	} else {
		vscode.window.showInformationMessage('No workspace folders are open.')
	}
}

export function deactivate() {
	const logsJson = JSON.stringify(logs, null, 2)
	const baseDirectory = "/Users/suyunhe/virtualme-demo/log/"
	const fileName = startTime + ".json" 
	const filePath = path.join(baseDirectory, fileName)
	fs.writeFileSync(filePath, logsJson, 'utf8')
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
	const formattedTime = `${year}-${formattedMonth}-${formattedDay}-${formattedHours}.${formattedMinutes}.${formattedSeconds}`
	return formattedTime
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
    );
    if (!symbols) {
        return undefined;
    }

    return findSymbolHierarchyAtPosition(symbols, position);
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
                const childHierarchy = findSymbolHierarchyAtPosition(symbol.children, position);
                if (childHierarchy) {
                    return [symbol, ...childHierarchy];
                }
            }
            return [symbol];
        }
    }
    return undefined;
}

/**
 * 将 SymbolKind 枚举值转换为对应的 ArtiFactType 枚举描述。
 * @param kind SymbolKind 枚举值。
 * @returns 对应的 ArtiFactType 枚举值。
 */
function getSymbolKindDescription(kind: vscode.SymbolKind): LogItem.ArtiFactType {
    switch (kind) {
        case vscode.SymbolKind.File:
            return LogItem.ArtiFactType.File;
        case vscode.SymbolKind.Module:
            return LogItem.ArtiFactType.Module;
        case vscode.SymbolKind.Namespace:
            return LogItem.ArtiFactType.Namespace;
        case vscode.SymbolKind.Package:
            return LogItem.ArtiFactType.Package;
        case vscode.SymbolKind.Class:
            return LogItem.ArtiFactType.Class;
        case vscode.SymbolKind.Method:
            return LogItem.ArtiFactType.Method;
        case vscode.SymbolKind.Property:
            return LogItem.ArtiFactType.Property;
        case vscode.SymbolKind.Field:
            return LogItem.ArtiFactType.Field;
        case vscode.SymbolKind.Constructor:
            return LogItem.ArtiFactType.Constructor;
        case vscode.SymbolKind.Enum:
            return LogItem.ArtiFactType.Enum;
        case vscode.SymbolKind.Interface:
            return LogItem.ArtiFactType.Interface;
        case vscode.SymbolKind.Function:
            return LogItem.ArtiFactType.Function;
        case vscode.SymbolKind.Variable:
            return LogItem.ArtiFactType.Variable;
        case vscode.SymbolKind.Constant:
            return LogItem.ArtiFactType.Constant;
        case vscode.SymbolKind.String:
            return LogItem.ArtiFactType.String;
        case vscode.SymbolKind.Number:
            return LogItem.ArtiFactType.Number;
        case vscode.SymbolKind.Boolean:
            return LogItem.ArtiFactType.Boolean;
        case vscode.SymbolKind.Array:
            return LogItem.ArtiFactType.Array;
        case vscode.SymbolKind.Object:
            return LogItem.ArtiFactType.Object;
        case vscode.SymbolKind.Key:
            return LogItem.ArtiFactType.Key;
        case vscode.SymbolKind.Null:
            return LogItem.ArtiFactType.Null;
        case vscode.SymbolKind.EnumMember:
            return LogItem.ArtiFactType.EnumMember;
        case vscode.SymbolKind.Struct:
            return LogItem.ArtiFactType.Struct;
        case vscode.SymbolKind.Event:
            return LogItem.ArtiFactType.Event;
        case vscode.SymbolKind.Operator:
            return LogItem.ArtiFactType.Operator;
        case vscode.SymbolKind.TypeParameter:
            return LogItem.ArtiFactType.TypeParameter;
        default:
            return LogItem.ArtiFactType.Unknown;
    }
}

/**
 * 分析文本更改事件并记录更改类型。
 * @param event 文本更改事件。
 */
function analyzeTextEdit(event: vscode.TextDocumentChangeEvent): LogItem.ChangeType {
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
			if(text.length === 0) {
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


