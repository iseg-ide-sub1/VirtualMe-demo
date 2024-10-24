import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
	/** 注册命令：virtualme-demo.virtuame */
	const disposable = vscode.commands.registerCommand('virtualme-demo.virtualme', () => {
		vscode.window.showInformationMessage('Thanks for using VirtualME Demo!')
	})
	context.subscriptions.push(disposable)

	// const taskStartWatcher = vscode.tasks.onDidStartTaskProcess(event => {
	// 	console.log(`Task started: ${event.execution.task.name}`)
	// 	vscode.window.showInformationMessage(`Task started: ${event.execution.task.name}`)
	// })
	// context.subscriptions.push(taskStartWatcher)

	const createFilesWatcher = vscode.workspace.onDidCreateFiles(event => {
		const formattedTime = getFormattedTime()
		console.log(`${formattedTime}          Created files: ${event.files}`)
		vscode.window.showInformationMessage(`${formattedTime}          Created files: ${event.files}`)
	})
	context.subscriptions.push(createFilesWatcher)

	if (vscode.workspace.workspaceFolders) {
		const filesWatcher = vscode.workspace.createFileSystemWatcher('**/*')
		// 监听文件更改事件
        filesWatcher.onDidChange(uri => {
			const formattedTime = getFormattedTime()
			console.log(`${formattedTime}          File changed: ${uri.fsPath}`)
			vscode.window.showInformationMessage(`${formattedTime}          File changed: ${uri.fsPath}`)
        })

        // 监听文件创建事件
        filesWatcher.onDidCreate(uri => {
			const formattedTime = getFormattedTime()
			console.log(`${formattedTime}          File created: ${uri.fsPath}`)
			vscode.window.showInformationMessage(`${formattedTime}          File created: ${uri.fsPath}`)
        })

        // 监听文件删除事件
        filesWatcher.onDidDelete(uri => {
			const formattedTime = getFormattedTime()
			console.log(`${formattedTime}          File deleted: ${uri.fsPath}`)
			vscode.window.showInformationMessage(`${formattedTime}          File deleted: ${uri.fsPath}`)
        })
	} else {
		vscode.window.showInformationMessage('No workspace folders are open.')
	}
	
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

export function deactivate() { }
