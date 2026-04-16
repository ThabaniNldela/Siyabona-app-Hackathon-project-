let reports = [];

const reportNumber = (req, res) => {
  const { number, reason } = req.body;

  const report = {
    id: reports.length + 1,
    number,
    reason
  };

  reports.push(report);

  res.json({
    message: "Report submitted",
    report
  });
};

const getReports = (req, res) => {
  res.json(reports);
};

module.exports = {
  reportNumber,
  getReports
};