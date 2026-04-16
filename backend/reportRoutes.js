const express = require("express");
const router = express.Router();

const {
  reportNumber,
  getReports
} = require("../controllers/reportController");

router.post("/report-number", reportNumber);
router.get("/reports", getReports);

module.exports = router;