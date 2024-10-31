import exp from "constants"

enum EventType {
    /** 打开文件 */
    OpenTextDocument = "Open text document",
    /** 关闭文件 */
    CloseTextDocument = "Close text document",
    /** 切换文件 */
    ChangeTextDocument = "Change text document",
    /** 添加文件内容 */
    AddTextDocument = "Add text document",
    /** 删除文件内容 */
    DeleteTextDocument = "Delete text document",
    /** 修改文件内容 */
    EditTextDocument = "Edit text document",
    /** Redo文件内容 */
    RedoTextDocument = "Redo text document",
    /** Undo文件内容 */
    UndoTextDocument = "Undo text document",
    /** 新建文件 */
    CreateFile = "Create file",
    /** 删除文件 */
    DeleteFile = "Delete file",
    /** 保存文件 */
    SaveFile = "Save file",
    /** 选中文本 */
    SelectText = "Select text",
    /** 打开终端 */
    OpenTerminal = "Open terminal",
    /** 关闭终端 */
    CloseTerminal = "Close terminal",
    /** 切换终端 */
    ChangeActiveTerminal = "Change active terminal",
}

export enum ArtiFactType {
    File = "File",
    Module = "Module",
    Namespace = "Namespace",
    Package = "Package",
    Class = "Class",
    Method = "Method",
    Property = "Property",
    Field = "Field",
    Constructor = "Constructor",
    Enum = "Enum",
    Interface = "Interface",
    Function = "Function",
    Variable = "Variable",
    Constant = "Constant",
    String = "String",
    Number = "Number",
    Boolean = "Boolean",
    Array = "Array",
    Object = "Object",
    Key = "Key",
    Null = "Null",
    EnumMember = "EnumMember",
    Struct = "Struct",
    Event = "Event",
    Operator = "Operator",
    TypeParameter = "TypeParameter",
    Terminal = "Terminal", // ?
    Unknown = "Unknown"
}

export enum ChangeType {
    Add = "Add",
    Delete = "Delete",
    Edit = "Edit",
    Redo = "Redo",
    Undo = "Undo",
    Unknown = "Unknown"
}

export class ArtiFact {
    constructor(
        public name: string,
        public type: ArtiFactType,
        public hierarchys?: ArtiFact[],
        public context?: {
            // 编辑位置
            position?: {
                line: number;
                character: number;
            };
            // 简化的作用域信息
            scope?: {
                file?: {
                    name: string;
                    path: string;
                };
                class?: {
                    name: string;
                };
                method?: {
                    name: string;
                };
            };
            // 代码变更信息
            change?: {
                type: ChangeType;
                content: {
                    before: string;
                    after: string;
                };
                length: {
                    before: number;
                    after: number;
                };
            };
            // 选择信息
            selection?: {
                text: string;
                range: {
                    start: { line: number; character: number };
                    end: { line: number; character: number };
                }
            }
        }
    ) {
    }

    toString(): string {
        let ret = ""
        ret += "    (1) Name: " + this.name + "\n"
        ret += "    (2) Type: " + this.type + "\n"
        if (this.hierarchys) {
            ret += "    (3) Hierarchy: \n"
            let retract = "    "
            for (let h of this.hierarchys) {
                retract += "  "
                ret += retract + "- " + h.name + "(" + h.type + ")" + "\n"
            }
        }
        return ret
    }
}

export class LogItem {
    static #nextId = 1
    id: number
    timeStamp: string
    eventType: EventType
    artifact: ArtiFact
    detail?: Map<string, any>

    constructor(eventType: EventType, artifact: ArtiFact, detail?: Map<string, any>) {
        this.id = LogItem.#nextId++
        this.timeStamp = getFormattedTime()
        this.eventType = eventType
        this.artifact = artifact
        this.detail = detail
    }

    toString(): string {
        let ret = ""
        ret = "No." + this.id + "  " + this.timeStamp + "\n"
            + "  1. EventType: " + this.eventType + "\n"
            + "  2. Artifact: \n" + this.artifact
        if (this.detail) {
            ret += "  3. Detail: \n"
            let idx: number = 1
            for (let [key, value] of this.detail) {
                ret += "    (" + idx + ") " + key + ": " + value + "\n"
                idx++
            }
        }
        return ret
    }

    toJSON() {
        const baseObject = {
            id: this.id,
            timeStamp: this.timeStamp,
            eventType: this.eventType,
            artifact: {
                name: this.artifact.name,
                type: this.artifact.type,
                hierarchys: this.artifact.hierarchys,
                context: this.artifact.context
            }
        }

        if (!this.detail) {
            return {
                ...baseObject,
                detail: {}
            }
        } else {
            const detailObject: { [key: string]: any } = {}
            for (const [key, value] of this.detail) {
                detailObject[key] = value
            }
            return {
                ...baseObject,
                detail: detailObject
            }
        }
    }
}

export class OpenTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.OpenTextDocument, artifact)
    }
}

export class CloseTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.CloseTextDocument, artifact)
    }
}

export class ChangeActiveTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.ChangeTextDocument, artifact)
    }
}

export class AddTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact, addContentLength: number, addContent: string) {
        let detail = new Map<string, any>()
        detail.set("addContentLength", addContentLength)
        detail.set("addContent", addContent)
        super(EventType.AddTextDocument, artifact, detail)
    }
}

export class DeleteTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact, deleteContentLength: number, deleteContent: string) {
        let detail = new Map<string, any>()
        detail.set("deleteContentLength", deleteContentLength)
        detail.set("deleteContent", deleteContent)
        super(EventType.DeleteTextDocument, artifact, detail)
    }
}

export class EditTextDocumentLog extends LogItem {
    constructor(
        artifact: ArtiFact,
        oldContent: string,
        newContent: string
    ) {
        let detail = new Map<string, any>()
        detail.set("oldContent", oldContent)
        detail.set("newContent", newContent)
        detail.set("contentLengthChange", newContent.length - oldContent.length)
        super(EventType.EditTextDocument, artifact, detail)
    }
}

export class RedoTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.RedoTextDocument, artifact)
    }
}

export class UndoTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.UndoTextDocument, artifact)
    }
}

export class CreateFileLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.CreateFile, artifact)
    }
}

export class DeleteFileLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.DeleteFile, artifact)
    }
}

export class SaveFileLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.SaveFile, artifact)
    }
}

export class SelectTextLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.SelectText, artifact)
    }
}


export class OpenTerminalLog extends LogItem {
    constructor(artifact: ArtiFact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.OpenTerminal, artifact, detail)
    }
}

export class CloseTerminalLog extends LogItem {
    constructor(artifact: ArtiFact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.CloseTerminal, artifact, detail)
    }
}

export class ChangeActiveTerminalLog extends LogItem {
    constructor(artifact: ArtiFact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.ChangeActiveTerminal, artifact, detail)
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
