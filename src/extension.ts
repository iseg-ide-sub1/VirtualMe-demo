import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('virtualme-demo.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from VirtualME Demo!');
	});

	context.subscriptions.push(disposable);

	// 监听文档变化
	const fileChangeWatcher = vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
		console.log(`File changed: ${event.document.uri.fsPath}`);

		// 获取变化的第一个位置（假设只处理第一个变化的位置）
		const changePosition = event.contentChanges[0]?.range.start;
		if (!changePosition) {
			console.log("No change position found.");
			return;
		}

		// 调用函数获取变化位置的符号信息链
		const symbolHierarchy = await getSymbolHierarchyAtPosition(event.document, changePosition);
		if (symbolHierarchy && symbolHierarchy.length > 0) {
			console.log('Symbol hierarchy (from file to deepest symbol):');
			symbolHierarchy.forEach(symbol => {
				console.log(`- ${symbol.name} (${symbol.kind})`);
			});
		} else {
			console.log("No symbol hierarchy found at the changed position.");
		}
	});
	context.subscriptions.push(fileChangeWatcher);
}

// 获取指定文档中特定位置的符号层级链
async function getSymbolHierarchyAtPosition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.DocumentSymbol[] | undefined> {
	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider', document.uri
	);
	if (!symbols) {
		return undefined;
	}

	return findSymbolHierarchyAtPosition(symbols, position);
}

// 递归查找符号层级链，从文件级到最小符号
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

export function deactivate() { }
