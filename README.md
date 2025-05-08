# Notion CMS with Tailwind + Vercel Serverless

## 結構

- `/public/index.html`：前端頁面（Tailwind）
- `/api/notion.js`：Notion API Proxy
- `package.json`：定義依賴（@notionhq/client）

## 使用說明

1. 建立 Notion Integration 並取得 Token
2. 設定 Vercel 環境變數：
   - NOTION_TOKEN
   - NOTION_DATABASE_ID
3. 上傳至 GitHub，並部署至 Vercel 即可
