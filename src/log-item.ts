import { getFormattedTime } from './common-utils'

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

export enum ArtifactType {
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

class Context {
    constructor(
        public position?: { // 编辑位置
            line: number,
            character: number
        },
        public scope?: { // 简化的作用域信息
            file?: { name: string, path: string },
            class?: { name: string },
            method?: { name: string }
        },
        public change?: { // 代码变更信息
            type: ChangeType,
            content: { before: string, after: string },
            length: { before: number, after: number },
        },
        public selection?: { // 选中的文本的信息
            text: string, // 选中的文本
            range: {
                start: { line: number, character: number }, // 选择开始位置（行和字符序号都从1开始）
                end: { line: number, character: number } // 选择结束位置（行和字符序号都从1开始）
            }
        }
    ) {}
}

export class Artifact {
    constructor(
        public name: string,
        public type: ArtifactType,
        public hierarchy?: Artifact[],
        public context?: Context
    ) {}

    toString(): string {
        let ret = ""
        ret += "    (1) Name: " + this.name + "\n"
        ret += "    (2) Type: " + this.type + "\n"
        if (this.hierarchy) {
            ret += "    (3) Hierarchy: \n"
            let retract = "    "
            for (let h of this.hierarchy) {
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
    artifact: Artifact
    detail?: Map<string, any>

    constructor(eventType: EventType, artifact: Artifact, detail?: Map<string, any>) {
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
                hierarchy: this.artifact.hierarchy,
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
    constructor(artifact: Artifact) {
        super(EventType.OpenTextDocument, artifact)
    }
}

export class CloseTextDocumentLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.CloseTextDocument, artifact)
    }
}

export class ChangeActiveTextDocumentLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.ChangeTextDocument, artifact)
    }
}

export class AddTextDocumentLog extends LogItem {
    constructor(artifact: Artifact, addContentLength: number, addContent: string) {
        let detail = new Map<string, any>()
        detail.set("addContentLength", addContentLength)
        detail.set("addContent", addContent)
        super(EventType.AddTextDocument, artifact, detail)
    }
}

export class DeleteTextDocumentLog extends LogItem {
    constructor(artifact: Artifact, deleteContentLength: number, deleteContent: string) {
        let detail = new Map<string, any>()
        detail.set("deleteContentLength", deleteContentLength)
        detail.set("deleteContent", deleteContent)
        super(EventType.DeleteTextDocument, artifact, detail)
    }
}

export class EditTextDocumentLog extends LogItem {
    constructor(
        artifact: Artifact,
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
    constructor(artifact: Artifact) {
        super(EventType.RedoTextDocument, artifact)
    }
}

export class UndoTextDocumentLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.UndoTextDocument, artifact)
    }
}

export class CreateFileLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.CreateFile, artifact)
    }
}

export class DeleteFileLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.DeleteFile, artifact)
    }
}

export class SaveFileLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.SaveFile, artifact)
    }
}

export class SelectTextLog extends LogItem {
    constructor(artifact: Artifact) {
        super(EventType.SelectText, artifact)
    }
}


export class OpenTerminalLog extends LogItem {
    constructor(artifact: Artifact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.OpenTerminal, artifact, detail)
    }
}

export class CloseTerminalLog extends LogItem {
    constructor(artifact: Artifact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.CloseTerminal, artifact, detail)
    }
}

export class ChangeActiveTerminalLog extends LogItem {
    constructor(artifact: Artifact, processId: number) {
        let detail = new Map<string, any>()
        detail.set("processId", processId)
        super(EventType.ChangeActiveTerminal, artifact, detail)
    }
}
