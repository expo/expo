/**
 * These are functions that only run within the Maestro JS environment.
 */
const serverBaseUrl = 'http://localhost:' + MAESTRO_UPDATES_SERVER_PORT;

function serveManifest(name, platform, channel) {
  var requestString = `${serverBaseUrl}/serve-manifest?name=${name}&platform=${platform}`;
  if (channel) {
    requestString += `&channel=${encodeURIComponent(channel)}`;
  }
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

function restartUpdatesServer(artificialDelay, serveOverriddenUrl) {
  const delay = artificialDelay || 0;
  var url = `${serverBaseUrl}/restart-server`;
  const queryParams = [];
  if (delay > 0) {
    queryParams.push(`ms=${delay}`);
  }
  if (serveOverriddenUrl) {
    queryParams.push(`serveOverriddenUrl=true`);
  }
  if (queryParams.length > 0) {
    url = `${url}?${queryParams.join('&')}`;
  }
  http.get(url);
  // Wait 0.5 second to allow server restart to complete
  http.get(`${serverBaseUrl}/delay?ms=500`);
}

function installClient(platform, configuration) {
  http.get(`${serverBaseUrl}/install-client?platform=${platform}&configuration=${configuration}`);
}

function uninstallClient(platform) {
  http.get(`${serverBaseUrl}/uninstall-client?platform=${platform}`);
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
  installClient: installClient,
  uninstallClient: uninstallClient,
  lastRequestHeaders: lastRequestHeaders,
  logEntries: logEntries,
  restartUpdatesServer: restartUpdatesServer,
  serveManifest: serveManifest,
  staticFileCount: staticFileCount,
  stopUpdatesServer: stopUpdatesServer,
};
