const Report = require("../models/Report");

const reportScam = async (req, res) => {
  try {
    const { phoneNumber, message, riskLevel } = req.body;

    const newReport = new Report({
      phoneNumber,
      message,
      riskLevel,
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: "Scam report saved successfully",
      data: newReport,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });

    res.status(200).json(reports);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};

module.exports = {
  reportScam,
  getReports,
};