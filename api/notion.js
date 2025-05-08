const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

// 將 rich_text 陣列轉為 HTML，支援樣式與換行
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

    // 連結處理
    if (b.href) {
      text = `<a href="${b.href}" target="_blank" class="text-blue-600 underline">${text}</a>`;
    }

    return text;
  }).join("");
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