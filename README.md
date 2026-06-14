# 办到 (BanDao)

免费在线办公工具箱，提供 PDF 处理、图片压缩、文本工具、开发小工具等常用功能。

**线上地址**: [https://bandao.it0731.cn](https://bandao.it0731.cn)

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | Next.js 16 + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + Shadcn/ui |
| 后端 | Go + Gin + SQLite |
| 认证 | GoAuth SSO (RS256) |
| 部署 | VPS + Nginx / Cloudflare Pages |

## 快速开始

### 前端

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

### 后端

```bash
cd BanDao-Backend
go build ./cmd/bandao
./bandao           # http://localhost:8080
```

## 项目结构

```
BanDao/                   # Next.js 前端 + 后台管理
├── src/
│   ├── app/
│   │   ├── api/          # SSO 认证 + 管理 API 代理
│   │   ├── admin/        # 后台管理页面
│   │   └── tools/        # 工具页
│   ├── lib/              # 工具函数
│   └── tools/            # 纯前端工具组件
│
BanDao-Backend/           # Go 后端服务
├── cmd/bandao/           # 入口
├── internal/
│   ├── config/           # 配置
│   ├── db/               # 数据库
│   ├── handlers/         # API 处理
│   ├── services/         # 文件转换服务
│   └── middleware/       # CORS + 认证
```

## 工具列表

- PDF 拆分 / 合并
- 图片压缩 / 裁剪 / SVG 转换
- 文本助手 / Markdown 预览
- JSON 格式化
- 二维码生成
- 隐私水印

## 部署

详见 [布署方法.md](./布署方法.md)，支持两种方案：

- **方案 A**: VPS 全栈部署（推荐）
- **方案 B**: Cloudflare Pages + VPS 混合部署

## 许可

MIT
