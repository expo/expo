'use strict';

var getDevServer = require('./getDevServer');
function openFileInEditor(file, lineNumber) {
  fetch(getDevServer().url + 'open-stack-frame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file: file,
      lineNumber: lineNumber
    })
  });
}
module.exports = openFileInEditor;
//# sourceMappingURL=openFileInEditor.js.map