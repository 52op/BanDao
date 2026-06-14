import { createFormatConvertTool } from "../format-convert-shared";

export default createFormatConvertTool({
  accept: ".ppt,.pptx,.odp",
  formats: [{ value: "pdf", label: "PDF" }],
  defaultFormat: "pdf",
  hint: "支持 PowerPoint / ODP 格式",
});
