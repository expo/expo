const fixes = require('./fix-links.json');

fixes.forEach(fix => {
  if (fix.current === fix.actual) {
    console.log(fix.current);
  }
});
