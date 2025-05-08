const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

// 將 rich_text 陣列轉為 HTML，支援樣式、換行、文字顏色與背景色
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

    // 顏色處理
    const colorMap = {
      "default": "",
      "gray": "text-gray-500",
      "brown": "text-amber-900",
      "orange": "text-orange-600",
      "yellow": "text-yellow-500",
      "green": "text-green-600",
      "blue": "text-blue-600",
      "purple": "text-purple-600",
      "pink": "text-pink-500",
      "red": "text-red-600",

      "gray_background": "bg-gray-200",
      "brown_background": "bg-amber-100",
      "orange_background": "bg-orange-100",
      "yellow_background": "bg-yellow-100",
      "green_background": "bg-green-100",
      "blue_background": "bg-blue-100",
      "purple_background": "bg-purple-100",
      "pink_background": "bg-pink-100",
      "red_background": "bg-red-100"
    };

    let textColor = "";
    let bgColor = "";
    const color = b.annotations.color;

    if (color.endsWith("_background")) {
      bgColor = colorMap[color] || "";
      textColor = "text-black"; // 預設背景色用黑字提高對比
    } else {
      textColor = colorMap[color] || "";
    }

    const classList = [textColor, bgColor].filter(Boolean).join(" ");
    if (classList) {
      text = `<span class="${classList}">${text}</span>`;
    }

    // 連結處理
    if (b.href) {
      text = `<a href="${b.href}" target="_blank" class="underline text-blue-600">${text}</a>`;
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
