# Notion CMS with Tailwind + Vercel Serverless

## 結構
```
notion-cms01/
├── api/
│   └── notion.js          # ✅ Vercel Serverless Function：作為前端 fetch 的 Notion API proxy
├── public/
│   └── index.html         # ✅ 前端主頁，使用 Tailwind CSS + JS 動態渲染 Notion 資料
├── package.json           # ✅ 定義 Node.js 專案依賴，目前只需 @notionhq/client
└── README.md
```

## 使用說明

1. 建立 Notion Integration 並取得 Token
2. 設定 Vercel 環境變數：
   - NOTION_TOKEN
   - NOTION_DATABASE_ID
3. 上傳至 GitHub，並部署至 Vercel 即可
