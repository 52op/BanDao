import { createFormatConvertTool } from "../format-convert-shared";

export default createFormatConvertTool({
  accept: ".xls,.xlsx,.ods,.csv",
  formats: [{ value: "pdf", label: "PDF" }],
  defaultFormat: "pdf",
  hint: "支持 Excel / ODS / CSV 格式",
});
