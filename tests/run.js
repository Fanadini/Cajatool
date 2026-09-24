#!/usr/bin/env node
/* Runner mínimo sin dependencias: ejecuta tests/*.test.js y muestra un resumen. */
'use strict';
const fs = require('fs');
const path = require('path');

const tests = [];
global.test = (name, fn) => tests.push({ name, fn, file: global.__currentFile });

const only = process.argv[2];
const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js') && (!only || f.includes(only))).sort();
for (const f of files) {
  global.__currentFile = f;
  require(path.join(__dirname, f));
}

(async () => {
  let pass = 0, fail = 0, lastFile = '';
  for (const t of tests) {
    if (t.file !== lastFile) { console.log(`\n${t.file}`); lastFile = t.file; }
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${t.name}\n    ${e.message.split('\n').join('\n    ')}`);
    }
  }
  console.log(`\n${pass} OK, ${fail} con error, ${tests.length} en total`);
  process.exit(fail ? 1 : 0);
})();
