const express = require("express");
const router = express.Router();

const {
  scanLink,
  scanMessage
} = require("../controllers/scanController");

router.post("/scan-link", scanLink);
router.post("/scan-message", scanMessage);

module.exports = router;