import { createFormatConvertTool } from "../format-convert-shared";

export default createFormatConvertTool({
  accept: ".pdf",
  formats: [
    { value: "docx", label: "Word (.docx)" },
    { value: "doc", label: "Word 97-2003 (.doc)" },
  ],
  defaultFormat: "docx",
  hint: "支持 PDF 格式",
});
