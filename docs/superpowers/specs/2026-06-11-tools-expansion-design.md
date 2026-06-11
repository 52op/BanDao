# 办到工具站 - 扩展设计文档

## 目标

为办到(BanDao)工具站新增 3 个核心工具、重构分类体系、加入 Ctrl+K 搜索功能。兼顾普通办公人员和技术人员。

## 分类重组

### 新分类体系

| 新分类 key | 显示名 | 包含工具 |
|-----------|--------|---------|
| `document` | 文档工具 | PDF 拆分、Markdown 预览(新) |
| `image` | 图片处理 | 图片压缩、隐私水印、SVG 转图片 |
| `developer` | 开发工具 | JSON 格式化(新)、文本助手 |
| `utility` | 实用工具 | 二维码生成器(新) |

### 分类映射变更

- `privacy` → `image`（watermark 从隐私安全移入图片处理）
- `text` → `developer`（text-cleaner 从文本助手移入开发工具）
- 新增 `document`、`developer`、`utility`

### registry.ts 变更

```ts
export type ToolCategory = "document" | "image" | "developer" | "utility";

export const categoryLabels: Record<ToolCategory, string> = {
  document: "文档工具",
  image: "图片处理",
  developer: "开发工具",
  utility: "实用工具",
};
```

## 新工具

### 1. 二维码生成器 (`qr-code`)

- **分类**: utility
- **依赖**: `qrcode` npm 包（纯前端 Canvas 渲染）
- **功能**:
  - 输入文本/链接，生成二维码
  - 选项：前景色、背景色、尺寸（默认 256px）
  - 支持批量（多行文本→多个二维码 ZIP 打包下载）
- **UI**: 输入区 + 实时预览 + 下载按钮

### 2. JSON 格式化 (`json-formatter`)

- **分类**: developer
- **依赖**: 无（纯文本处理）
- **功能**:
  - 粘贴 JSON → 格式化输出
  - 压缩（minify）模式
  - 语法错误定位（行号 + 列号）
  - 树形展开/折叠（可选）
- **UI**: 左右双栏（输入/输出），错误提示在底部

### 3. Markdown 预览 (`markdown-preview`)

- **分类**: document
- **依赖**: `react-markdown` + `remark-gfm`
- **功能**:
  - 左侧编辑区 + 右侧实时预览
  - 支持 GFM 语法（表格、任务列表、删除线等）
  - 导出为 HTML 文件下载
- **UI**: 左右分栏编辑器布局

## Ctrl+K 搜索

### 依赖

- `cmdk`（~5KB gzipped，Shadcn/ui 官方推荐）

### 功能

- 全局快捷键 `Ctrl+K`（Mac: `Cmd+K`）唤起搜索弹窗
- 搜索范围：工具名称、描述、分类名
- 键盘操作：上下选择、回车跳转、ESC 关闭
- 侧栏顶部放搜索按钮，点击等同 Ctrl+K

### UI

- 居中模态框，半透明遮罩
- 输入框在顶部，结果列表在下方
- 结果项显示：图标 + 工具名 + 分类标签
- 命中文字高亮

## UI 改造

### Sidebar 分组

```
[Logo]

── 文档工具 ──
  PDF 拆分
  Markdown 预览

── 图片处理 ──
  图片压缩
  隐私水印
  SVG 转图片

── 开发工具 ──
  JSON 格式化
  文本助手

── 实用工具 ──
  二维码生成器

[公众号提示]
```

- 分类标题：小号灰色文字（`text-xs text-muted-foreground`）
- 工具项：保持现有样式，当前选中高亮

### 首页分组

- 按分类分组展示卡片
- 每组有分类标题
- 组内卡片横向排列（4 列网格）
- 搜索结果命中时高亮匹配文字

### 交互流

```
首页分组卡片 → 点击进入工具
     或 Ctrl+K → 搜索 → 跳转
     或 侧栏分组列表 → 选择
```

## 依赖清单（新增）

```json
{
  "qrcode": "^1.5",
  "cmdk": "^1.0",
  "react-markdown": "^9",
  "remark-gfm": "^4"
}
```

## 实施顺序

1. 分类重组（registry.ts 类型 + 映射 + 现有工具迁移）
2. Sidebar 分组渲染
3. 首页分组渲染
4. Ctrl+K 搜索（cmdk 集成）
5. 二维码生成器
6. JSON 格式化
7. Markdown 预览
8. 更新 开发必看.md
