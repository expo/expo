const serverBaseUrl = 'http://localhost:4747';

function serveManifest(name, platform) {
  var requestString = `${serverBaseUrl}/serve-manifest?name=${name}&platform=${platform}`;
  const response = http.get(requestString);
  return response.body;
}

function lastRequestHeaders() {
  var requestString = `${serverBaseUrl}/last-request-headers`;
  const response = http.get(requestString);
  return JSON.parse(response.body);
}

function stopUpdatesServer() {
  http.get(`${serverBaseUrl}/stop-server`);
}

function restartUpdatesServer() {
  http.get(`${serverBaseUrl}/restart-server`);
  // Delay 0.5 second to allow server restart to complete
  http.get(`${serverBaseUrl}/delay?ms=500`);
}

function delay(ms) {
  http.get(`${serverBaseUrl}/delay?ms=${ms}`);
}

function staticFileCount() {
  var requestString = `${serverBaseUrl}/static-file-count`;
  const response = http.get(requestString);
  return JSON.parse(response.body).count;
}

function logEntries() {
  var requestString = `${serverBaseUrl}/log-entries`;
  const response = http.get(requestString);
  return JSON.parse(response.body);
}

output.api = {
  delay: delay,
  lastRequestHeaders: lastRequestHeaders,
  logEntries: logEntries,
  restartUpdatesServer: restartUpdatesServer,
  serveManifest: serveManifest,
  staticFileCount: staticFileCount,
  stopUpdatesServer: stopUpdatesServer,
};
