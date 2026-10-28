
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

    const token = process.env.HF_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "Add HF_TOKEN in Render Environment."
      });
    }

    const aiResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:fastest",
          messages: [
            {
              role: "system",
              content:
                "You are a news editor. Summarize the supplied article in simple English. Identify the main event, who is involved, what happened, why it matters, and important numbers or dates if present. Give 3 to 5 concise bullet points and one short overall summary. Do not repeat the article word for word. Do not invent facts. If information is missing, do not guess."
            },
            {
              role: "user",
              content: text.slice(0, 12000)
            }
          ],
          max_tokens: 300,
          temperature: 0.2
        })
      }
    );

    const result = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({
        error: result.error?.message ||
          result.error ||
          "AI summarization failed."
      });
    }

    const summary = result.choices?.[0]?.message?.content;

    if (!summary) {
      return res.status(502).json({
        error: "AI returned an empty summary."
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
