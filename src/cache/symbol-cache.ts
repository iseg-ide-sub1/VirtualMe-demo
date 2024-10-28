import * as vscode from 'vscode';
import { SymbolCacheItem } from '../types/code-context';

export class SymbolCache {
    private cache: Map<string, SymbolCacheItem> = new Map();
    private readonly CACHE_TIMEOUT = 5000; // 5秒缓存

    async getSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
        const uri = document.uri.toString();
        const cached = this.cache.get(uri);

        if (this.isValidCache(cached)) {
            // 添加空值检查
            if (!cached) {
                return [];  // 或者其他适当的默认值
            }
            return cached.symbols;
        }

        const symbols = await this.fetchSymbols(document);
        this.updateCache(uri, symbols);
        return symbols;
    }

    private isValidCache(cached?: SymbolCacheItem): boolean {
        if (!cached) {
            return false;
        }
        return Date.now() - cached.timestamp < this.CACHE_TIMEOUT;
    }

    private async fetchSymbols(document: vscode.TextDocument): Promise<vscode.DocumentSymbol[]> {
        try {
            return await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            ) || [];
        } catch (error) {
            console.error('获取符号失败:', error);
            return [];
        }
    }

    private updateCache(uri: string, symbols: vscode.DocumentSymbol[]): void {
        this.cache.set(uri, {
            symbols,
            timestamp: Date.now()
        });
    }

    public clearCache(uri?: string): void {
        if (uri) {
            this.cache.delete(uri);
        } else {
            this.cache.clear();
        }
    }
}
