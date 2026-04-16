const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Siyabona Backend");
});

app.get("/health", (req, res) => {
  res.json({
    status: "running",
    app: "Siyabona Backend",
    port: 5000
  });
});
app.post("/scan-link", (req, res) => {
  const { url } = req.body;

  let risk = 10;
  let reasons = [];

  const text = url.toLowerCase();

  if (text.includes("login")) {
    risk += 30;
    reasons.push("Contains login keyword");
  }

  if (text.includes(".xyz")) {
    risk += 40;
    reasons.push("Suspicious domain");
  }

  if (text.includes("free")) {
    risk += 20;
    reasons.push("Uses bait word");
  }

  let status = "Safe";

  if (risk >= 70) status = "Suspicious";
  if (risk >= 90) status = "Dangerous";

  res.json({
    type: "Link Scan",
    url,
    riskScore: risk,
    status,
    reasons
  });
});
app.post("/scan-message", (req, res) => {
  const { message } = req.body;

  let risk = 10;
  let reasons = [];

  const text = message.toLowerCase();

  if (text.includes("urgent")) {
    risk += 30;
    reasons.push("Urgency wording");
  }

  if (text.includes("account blocked")) {
    risk += 40;
    reasons.push("Threat tactic");
  }

  if (text.includes("click here")) {
    risk += 30;
    reasons.push("Suspicious action request");
  }

  let status = "Safe";

  if (risk >= 70) status = "Suspicious";
  if (risk >= 90) status = "Dangerous";

  res.json({
    type: "SMS Scan",
    message,
    riskScore: risk,
    status,
    reasons
  });
});
let reports = [];
app.post("/report-number", (req, res) => {
  const { number, reason } = req.body;

  const report = {
    id: reports.length + 1,
    number,
    reason
  };

  reports.push(report);

  res.json({
    message: "Scam number reported successfully",
    report
  });
});
app.get("/reports", (req, res) => {
  res.json(reports);
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});