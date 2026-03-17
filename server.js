#!/usr/bin/env node

// Legacy wrapper: delegates to the TypeScript-compiled dist.
// Tests and CLI both reference this file.

const { createApp } = require('./dist/server/app');
const { matchPattern } = require('./dist/server/utils/pattern');

module.exports = { createApp, matchPattern };

// CLI entry: delegate to dist/server/index.js
if (require.main === module) {
  require('./dist/server/index');
}
