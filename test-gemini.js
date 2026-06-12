const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : null;

if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const payload = {
  contents: [{ parts: [{ text: "Hello" }] }],
  generationConfig: { responseMimeType: "application/json" }
};

fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(res => res.text()).then(text => {
  console.log("Response for 1.5-flash:", text);
}).catch(err => console.error(err));

const endpoint2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

fetch(endpoint2, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(res => res.text()).then(text => {
  console.log("Response for 3.5-flash:", text);
}).catch(err => console.error(err));
