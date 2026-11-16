function pick(name) {
  const f = { heuristic: require('./heuristic'), llm: require('./llm'), cmd: require('./cmd') };
  if (name !== 'auto') { if (!f[name]) throw new Error('unknown fixer ' + name); return f[name]; }
  if (f.cmd.available()) return f.cmd;
  if (f.llm.available()) return f.llm;
  return f.heuristic;
}
module.exports = { pick };
