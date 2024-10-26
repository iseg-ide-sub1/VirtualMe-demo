import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as LogItem from './log-item'

let logs: LogItem.LogItem[] = []

export function activate(context: vscode.ExtensionContext) {
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
        const changePosition = event.contentChanges[0]?.range.start
        if (!changePosition) {
            console.log("No change position found.")
            return
        }
        const symbolHierarchy = await getSymbolHierarchyAtPosition(event.document, changePosition)
		let hierarchys: LogItem.ArtiFact[] = []
		let type: LogItem.ArtiFactType = LogItem.ArtiFactType.Unknown
        if (symbolHierarchy && symbolHierarchy.length > 0) {
			for (let symbol of symbolHierarchy) {
				const h = new LogItem.ArtiFact(symbol.name, getSymbolKindDescription(symbol.kind))
				hierarchys.push(h)
			}
			type = hierarchys[hierarchys.length - 1].type
        }

		const artifact = new LogItem.ArtiFact(event.document.uri.toString(),type, hierarchys) //todo
		const changeTextDocumentLog = new LogItem.ChangeTextDocumentLog(artifact)
		logs.push(changeTextDocumentLog)
		changeTextDocumentLog.output2console()
		// console.log(`          reason: ${event.reason}`)
	})
	context.subscriptions.push(changeTextDocumentWatcher)
 
	if (vscode.workspace.workspaceFolders) {
		const filesWatcher = vscode.workspace.createFileSystemWatcher('**/*')
		// 监听文件更改事件
        filesWatcher.onDidChange(uri => {
			const artifact = new LogItem.ArtiFact(uri.toString(), LogItem.ArtiFactType.File)
			const changeFileLog = new LogItem.ChangeFileLog(artifact)
			logs.push(changeFileLog)
			changeFileLog.output2console()
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
	console.log("In deactivate()")
	
	// animals.push(new Animal("Generic 啦啦啦啦啦 Animal"))
	// animals.push(new Snake("Sammy the Snake"))
	// animals.push(new Horse("Tommy the Horse"))

	// const animalsJson = serializeItem(animals)

	// const baseDirectory = '/Users/suyunhe/virtualme-demo/' 
	// const fileName = 'output.json' 
	// const filePath = path.join(baseDirectory, fileName)
	// fs.writeFileSync(filePath, animalsJson, 'utf8')
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
            // 如果光标在当前符号范围内，继续查找子符号
            if (symbol.children.length > 0) {
                const childHierarchy = findSymbolHierarchyAtPosition(symbol.children, position);
                if (childHierarchy) {
                    // 返回包含上级符号和子符号的层级链
                    return [symbol, ...childHierarchy];
                }
            }
            // 如果没有子符号或没有找到子符号，返回当前符号
            return [symbol];
        }
    }
    return undefined; // 没有找到符号
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
 * 将类及其子类实例的数组序列化为JSON字符串。
 * @param items 类及其子类实例的数组。
 * @returns 序列化后的JSON字符串，其中每个对象都以简单的键值对形式表示。
 */
// function serializeItem(items: Animal[]): string {
//     return JSON.stringify(items, (key, value) => {
//         if (value instanceof Animal) {
//             return {
//                 name: value.name,
//                 type: value.constructor.name,
//             }
//         }
//         return value
//     }, 2)
// }


