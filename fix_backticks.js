const fs = require('fs');
let code = fs.readFileSync('app/client/page.tsx', 'utf8');

// The file literally contains "\`" instead of "`"
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('app/client/page.tsx', code);
