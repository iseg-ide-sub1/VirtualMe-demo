import * as vscode from 'vscode';

export interface CodeContext {
    // 文件信息
    uri: string;
    languageId: string;
    
    // 位置信息
    position: vscode.Position;
    
    // 符号信息
    containingSymbols: vscode.DocumentSymbol[];
    scope: string;
    
    // 代码片段
    currentLine: string;
    surroundingCode: string;
    
    // 语义信息
    semanticTokens?: SemanticInfo;
}

export interface SemanticInfo {
    type: string;
    modifiers: string[];
    text: string;
}

export interface SymbolCacheItem {
    symbols: vscode.DocumentSymbol[];
    timestamp: number;
}
