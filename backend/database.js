const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./siyabona.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("SQLite Database Connected");
  }
});

db.run(`
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL,
  reason TEXT NOT NULL
)
`);

module.exports = db;