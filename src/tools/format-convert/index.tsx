import { createFormatConvertTool } from "../format-convert-shared";

export default createFormatConvertTool({
  accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.html,.txt,.csv",
  formats: [
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word (.docx)" },
    { value: "xlsx", label: "Excel (.xlsx)" },
    { value: "pptx", label: "PowerPoint (.pptx)" },
    { value: "html", label: "HTML" },
    { value: "rtf", label: "RTF" },
    { value: "txt", label: "纯文本" },
    { value: "odt", label: "OpenDocument (.odt)" },
  ],
  defaultFormat: "pdf",
  hint: "支持 PDF/Word/Excel/PPT/HTML/RTF 等格式",
});
