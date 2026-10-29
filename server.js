
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI News Backend is working!");
});

app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "general";

    const queries = {
      general: "India news",
      business: "India business",
      entertainment: "India entertainment",
      health: "India health",
      science: "India science",
      sports: "India sports",
      technology: "India technology"
    };

    if (!queries[category]) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const key = process.env.NEWS_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "NEWS_API_KEY is missing in Render"
      });
    }

    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", queries[category]);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");

    const response = await fetch(url, {
      headers: { "X-Api-Key": key }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || "News request failed",
        code: data.code
      });
    }

    const articles = (data.articles || []).map(article => ({
      ...article,
      description: article.description || "",
      content: article.content || article.description || ""
    }));

    res.json({ ...data, articles });
  } catch (error) {
    res.status(500).json({ error: "Could not load news" });
  }
});

app.post("/api/summarize", async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();

    if (text.length < 50) {
      return res.status(400).json({
        error: "Please provide a longer news article."
      });
    }

    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Render."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Summarize this news in simple English. Give 3 to 5 bullet points and one short overall summary. Do not invent facts.\n\n" +
                text.slice(0, 12000)
            }]
          }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.2
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gemini summary failed."
      });
    }

    const summary = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n");

    if (!summary) {
      return res.status(502).json({
        error: "Gemini returned an empty summary."
      });
    }

    res.json({ summary });
  } catch (error) {
    res.status(500).json({
      error: "Could not summarize the news."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("AI News Backend started");
});
