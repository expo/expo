'use strict';

var getDevServer = require('./getDevServer');
function openURLInBrowser(url) {
  fetch(getDevServer().url + 'open-url', {
    method: 'POST',
    body: JSON.stringify({
      url: url
    })
  });
}
module.exports = openURLInBrowser;
//# sourceMappingURL=openURLInBrowser.js.map