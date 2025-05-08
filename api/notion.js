const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

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
          property: "Date",
          direction: "descending",
        },
      ],
    });

    const results = response.results.map((page) => {
      return {
        title: page.properties.Title?.title[0]?.plain_text || "",
        description: page.properties.Description?.rich_text[0]?.plain_text || "",
        image: page.properties.Image?.url || "",
        category: page.properties.Category?.select?.name || "",
        date: page.properties.Date?.date?.start || "",
      };
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(results);
  } catch (error) {
    console.error("Notion API error:", error);
    res.status(500).json({ error: "Failed to fetch Notion data" });
  }
};
