const fs = require('fs');
const path = require('path');

// Append-only event log, rewritten atomically as a JSON file the dashboard polls.
class Timeline {
  constructor(file, meta) {
    this.file = file; this.data = { meta: { ...meta, startedAt: new Date().toISOString() }, events: [] };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.flush();
  }
  add(type, payload = {}) {
    const ev = { n: this.data.events.length + 1, t: new Date().toISOString(), type, ...payload };
    this.data.events.push(ev); this.flush();
    return ev;
  }
  finish(summary) { this.data.meta.finishedAt = new Date().toISOString(); this.data.meta.summary = summary; this.flush(); }
  flush() { fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.data, null, 2)); fs.renameSync(this.file + '.tmp', this.file); }
}
module.exports = { Timeline };
