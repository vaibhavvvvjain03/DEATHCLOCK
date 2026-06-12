const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
const apiKey = keyMatch ? keyMatch[1].trim() : null;

const payload = {
  contents: [{ parts: [{ text: "Hello" }] }],
  generationConfig: { responseMimeType: "application/json" }
};

['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash'].forEach(model => {
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }).then(res => res.text()).then(text => {
    console.log(`Response for ${model}:`, text.substring(0, 100));
  }).catch(err => console.error(err));
});
