enum EventType {
    OpenTextDocument = "Open text document",
    CloseTextDocument = "Close text document",
    AddTextDocument = "Add text document",
    DeleteTextDocument = "Delete text document",
    EditTextDocument = "Edit text document",
    RedoTextDocument = "Redo text document",
    UndoTextDocument = "Undo text document",
    CreateFile = "Create a file",
    DeleteFile = "Delete a file",
    SaveFile = "Save a file"
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
    name: string
    type: ArtiFactType
    hierarchy?: ArtiFact[]

    constructor(name: string, type: ArtiFactType, hierarchy?: ArtiFact[]) {
        this.name = name
        this.type = type
        this.hierarchy = hierarchy
    }

    toString() : string {
        var ret = ""
        ret += "    (1) Name: " + this.name + "\n"
        ret += "    (2) Type: " + this.type + "\n"
        if (this.hierarchy) {
            ret += "    (3) Hierarchy: \n"
            var retract = "    "
            for (var h of this.hierarchy) {
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

    constructor(eventType: EventType, artifact: ArtiFact) {
        this.id = LogItem.#nextId++
        this.timeStamp = getFormattedTime()
        this.eventType = eventType
        this.artifact = artifact
    }

    output2console(): void {
        const output = this.timeStamp + "\n"
            + "  1. EventType: " + this.eventType + "\n"
            + "  2. Artifact: \n" + this.artifact
        console.log(output)
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

export class AddTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.AddTextDocument, artifact)
    }
}

export class DeleteTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.DeleteTextDocument, artifact)
    }
}

export class EditTextDocumentLog extends LogItem {
    constructor(artifact: ArtiFact) {
        super(EventType.EditTextDocument, artifact)
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
