
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

    const url = new URL(
      "https://newsapi.org/v2/everything"
    );

    const queries = {
      general: "India news",
      business: "India business",
      entertainment: "India entertainment",
      health: "India health",
      science: "India science",
      sports: "India sports",
      technology: "India technology"
    };

    url.searchParams.set("q", queries[category]);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": key
      }
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("AI News Backend started");
});
