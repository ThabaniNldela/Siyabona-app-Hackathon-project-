const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  riskLevel: {
    type: String,
    default: "Suspicious",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", reportSchema);