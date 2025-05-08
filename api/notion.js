const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

// 將 rich_text 陣列轉為 HTML，支援樣式、換行、文字顏色與背景色（使用 inline style）
function renderRichText(blocks) {
  return blocks.map(b => {
    let text = b.plain_text;
    if (!text) return "";

    // 換行處理
    text = text.replace(/\n/g, "<br>");

    // 樣式處理
    if (b.annotations.code) text = `<code>${text}</code>`;
    if (b.annotations.bold) text = `<strong>${text}</strong>`;
    if (b.annotations.italic) text = `<em>${text}</em>`;
    if (b.annotations.underline) text = `<u>${text}</u>`;
    if (b.annotations.strikethrough) text = `<s>${text}</s>`;

    // 顏色處理（使用 inline style）
    const color = b.annotations.color;
    let style = "";

    if (color.endsWith("_background")) {
      const base = color.replace("_background", "");
      style += `background-color: ${getCssColor(base, true)}; color: black;`;
    } else if (color !== "default") {
      style += `color: ${getCssColor(color)};`;
    }

    if (style) {
      text = `<span style="${style}">${text}</span>`;
    }

    // 連結處理
    if (b.href) {
      text = `<a href="${b.href}" target="_blank" class="underline text-blue-600">${text}</a>`;
    }

    return text;
  }).join("");
}

// 對應 Notion 色彩為 CSS 顏色值
function getCssColor(name, isBg = false) {
  const map = {
    gray: "#6B7280", red: "#DC2626", yellow: "#FBBF24", green: "#16A34A",
    blue: "#2563EB", purple: "#7C3AED", pink: "#EC4899", brown: "#92400E",
  };
  const bgMap = {
    gray: "#E5E7EB", red: "#FECACA", yellow: "#FEF3C7", green: "#D1FAE5",
    blue: "#DBEAFE", purple: "#EDE9FE", pink: "#FCE7F3", brown: "#F3E8E0",
  };
  return isBg ? (bgMap[name] || "#F3F4F6") : (map[name] || "#111827");
}

module.exports = async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Published",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    });

    const results = response.results.map((page) => {
      const rawHex = page.properties["Hex Code"]?.rich_text?.[0]?.plain_text || "";
      const hex = rawHex.startsWith("#") ? rawHex : (rawHex ? "#" + rawHex : "");

      return {
        title: page.properties.Title?.title[0]?.plain_text || "",
        description: renderRichText(page.properties.Description?.rich_text || []),
        image: page.properties.Image?.url || "",
        category: page.properties.Category?.select?.name || "",
        date: page.properties.Date?.date?.start || "",
        hex: hex
      };
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(results);
  } catch (error) {
    console.error("Notion API error:", error);
    res.status(500).json({ error: "Failed to fetch Notion data" });
  }
};
