import * as vscode from 'vscode';
import { CodeContext, SemanticInfo } from '../types/code-context';
import { SymbolCache } from '../cache/symbol-cache';

export class CodeContextAnalyzer {
    private symbolCache: SymbolCache;

    constructor() {
        this.symbolCache = new SymbolCache();
    }

    async getContext(document: vscode.TextDocument, position: vscode.Position): Promise<CodeContext> {
        const symbols = await this.symbolCache.getSymbols(document);
        
        return {
            uri: document.uri.toString(),
            languageId: document.languageId,
            position: position,
            containingSymbols: this.findContainingSymbols(symbols, position),
            scope: this.determineScope(symbols, position),
            currentLine: this.getCurrentLine(document, position),
            surroundingCode: this.getSurroundingCode(document, position, 3),
            semanticTokens: await this.getSemanticInfo(document, position)
        };
    }

    private findContainingSymbols(
        symbols: vscode.DocumentSymbol[],
        position: vscode.Position
    ): vscode.DocumentSymbol[] {
        const containingSymbols: vscode.DocumentSymbol[] = [];

        const searchSymbols = (symbols: vscode.DocumentSymbol[]) => {
            for (const symbol of symbols) {
                if (symbol.range.contains(position)) {
                    containingSymbols.push(symbol);
                    if (symbol.children) {
                        searchSymbols(symbol.children);
                    }
                }
            }
        };

        searchSymbols(symbols);
        return containingSymbols;
    }

    private determineScope(symbols: vscode.DocumentSymbol[], position: vscode.Position): string {
        const containingSymbols = this.findContainingSymbols(symbols, position);
        return containingSymbols
            .map(symbol => symbol.name)
            .join('.');
    }

    private getCurrentLine(document: vscode.TextDocument, position: vscode.Position): string {
        return document.lineAt(position.line).text;
    }

    private getSurroundingCode(
        document: vscode.TextDocument,
        position: vscode.Position,
        lineCount: number
    ): string {
        const startLine = Math.max(0, position.line - lineCount);
        const endLine = Math.min(document.lineCount - 1, position.line + lineCount);
        
        return Array.from(
            { length: endLine - startLine + 1 },
            (_, i) => document.lineAt(startLine + i).text
        ).join('\n');
    }

    private async getSemanticInfo(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<SemanticInfo | undefined> {
        try {
            const tokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
                'vscode.provideDocumentSemanticTokens',
                document.uri
            );

            if (!tokens) {
                return undefined;
            }

            // 这里需要根据具体语言服务器的实现来解析语义标记
            // 这是一个简化的示例
            return {
                type: 'variable', // 需要根据实际token类型确定
                modifiers: ['readonly'], // 需要根据实际修饰符确定
                text: document.getText(document.getWordRangeAtPosition(position))
            };
        } catch (error) {
            console.error('获取语义信息失败:', error);
            return undefined;
        }
    }
}
