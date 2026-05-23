const express = require("express");
const router = express.Router();

const {
  reportScam,
  getReports
} = require("../controllers/reportController");

router.post("/report-number", reportScam);

router.get("/reports", getReports);

module.exports = router;