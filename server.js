require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home Page
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>DeepSeek API Test</title>
    <style>
      body { font-family: Arial; padding: 20px; max-width: 600px; margin: auto; }
      textarea { width: 100%; height: 100px; padding: 10px; font-size: 16px; }
      button { padding: 10px 20px; font-size: 16px; margin-top: 10px; }
      #response { margin-top: 20px; background: #f4f4f4; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
    </style>
  </head>
  <body>

  <h1>🤖 DeepSeek से सवाल पूछें</h1>

  <form id="chatForm">
    <textarea id="prompt" placeholder="अपना सवाल लिखें..."></textarea><br>
    <button type="submit">भेजें</button>
  </form>

  <div id="response"></div>

  <script>
    document.getElementById("chatForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const prompt = document.getElementById("prompt").value;
      const responseDiv = document.getElementById("response");

      if(!prompt.trim()){
        responseDiv.textContent = "पहले सवाल लिखो";
        return;
      }

      responseDiv.textContent = "लोड हो रहा है...";

      try{
        const res = await fetch("/api/chat",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ prompt })
        });

        const data = await res.json();

        if(data.reply){
          responseDiv.textContent = data.reply;
        }else{
          responseDiv.textContent = data.error || "कोई जवाब नहीं मिला";
        }

      }catch(err){
        responseDiv.textContent = "गलती: " + err.message;
      }
    });
  </script>

  </body>
  </html>
  `);
});


// API Route
app.post("/api/chat", async (req, res) => {

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "सवाल लिखिए" });
  }

  try {

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key नहीं मिली" });
    }

    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${apiKey}\`
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    res.json({ reply });

  } catch (error) {

    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: error.response?.data?.error?.message || "API से बात नहीं हो पाई"
    });

  }

});


app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
