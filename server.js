
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI News Backend is working!");
});

// Get live news
app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "general";

    const allowed = [
      "business",
      "entertainment",
      "health",
      "science",
      "sports",
      "technology",
      "general"
    ];

    if (!allowed.includes(category)) {
      return res.status(400).json({
        error: "Invalid category"
      });
    }

    const key = process.env.NEWS_API_KEY;

    if (!key) {
      return res.status(500).json({
        error: "News API key is missing"
      });
    }

    const queries = {
      general: "India news",
      business: "India business",
      entertainment: "India entertainment",
      health: "India health",
      science: "India science",
      sports: "India sports",
      technology: "India technology"
    };

    const url = new URL(
      "https://newsapi.org/v2/everything"
    );

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

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: "Could not load news"
    });
  }
});

// Extract the main sentences from an article
app.post("/api/summarize", (req, res) => {
  const text = req.body.text;

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      error: "Please provide news article text"
    });
  }

  const cleanText = text
    .replace(/\s+/g, " ")
    .trim();

  const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];

  if (sentences.length === 0) {
    return res.json({
      summary: cleanText
    });
  }

  const important = sentences
    .map((sentence, index) => ({
      sentence: sentence.trim(),
      index,
      score: sentence.trim().split(/\s+/).length
    }))
    .filter(item => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence);

  res.json({
    summary: (important.length
      ? important
      : sentences.slice(0, 2).map(s => s.trim())
    ).join(" ")
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("AI News Backend started");
});
