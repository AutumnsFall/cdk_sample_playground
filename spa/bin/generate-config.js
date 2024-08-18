const fs = require('fs');
const path = require('path');
const config = require('config');

console.log('generate-config for spa', config);

fs.writeFileSync(
  path.resolve(__dirname, '../config/spa.json'),
  JSON.stringify(config.get('spa')),
);
