const scanLink = (req, res) => {
  const { url } = req.body;

  let risk = 10;
  let reasons = [];

  if (url.includes("login")) {
    risk += 30;
    reasons.push("Contains login keyword");
  }

  if (url.includes(".xyz")) {
    risk += 40;
    reasons.push("Suspicious domain");
  }

  if (url.includes("free")) {
    risk += 20;
    reasons.push("Uses bait word");
  }

  res.json({
    type: "Link Scan",
    url,
    riskScore: risk,
    reasons
  });
};

const scanMessage = (req, res) => {
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

  res.json({
    type: "SMS Scan",
    message,
    riskScore: risk,
    reasons
  });
};

module.exports = {
  scanLink,
  scanMessage
};