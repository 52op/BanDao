import { createFormatConvertTool } from "../format-convert-shared";

export default createFormatConvertTool({
  accept: ".doc,.docx,.odt,.rtf",
  formats: [{ value: "pdf", label: "PDF" }],
  defaultFormat: "pdf",
  hint: "支持 Word / ODT / RTF 格式",
});
