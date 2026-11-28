/**
 * These are functions that only run within the Maestro JS environment.
 */
const serverBaseUrl = 'http://localhost:' + MAESTRO_UPDATES_SERVER_PORT;

function requestOrThrow(url) {
  const response = http.get(url);
  const failed =
    !response ||
    response.ok === false ||
    (typeof response.status === 'number' && (response.status < 200 || response.status >= 300));
  if (failed) {
    const status = response ? response.status : 'no-response';
    const body = response && response.body ? response.body : '';
    throw new Error(`Updates test server request failed (${status}) for ${url}: ${body}`);
  }
  return response;
}

function serveManifest(name, platform, channel) {
  var requestString = `${serverBaseUrl}/serve-manifest?name=${name}&platform=${platform}`;
  if (channel) {
    requestString += `&channel=${encodeURIComponent(channel)}`;
  }
  const response = requestOrThrow(requestString);
  return response.body;
}

function lastRequestHeaders() {
  const response = requestOrThrow(`${serverBaseUrl}/last-request-headers`);
  return JSON.parse(response.body);
}

function waitForUpdateRequest(timeoutMs, consume) {
  const params = [];
  if (timeoutMs) {
    params.push(`timeout=${timeoutMs}`);
  }
  if (consume === false) {
    params.push('consume=false');
  }
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  const response = requestOrThrow(`${serverBaseUrl}/wait-for-update-request${query}`);
  return JSON.parse(response.body);
}

function lastAssetRequestHeaders() {
  const response = requestOrThrow(`${serverBaseUrl}/last-asset-request-headers`);
  return JSON.parse(response.body);
}

function stopUpdatesServer() {
  requestOrThrow(`${serverBaseUrl}/stop-server`);
}

function restartUpdatesServer(artificialDelay, serveOverriddenUrl) {
  const delay = artificialDelay || 0;
  var url = `${serverBaseUrl}/reset`;
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
  requestOrThrow(url);
}

function installClient(platform, configuration) {
  requestOrThrow(
    `${serverBaseUrl}/install-client?platform=${platform}&configuration=${configuration}`
  );
}

function uninstallClient(platform) {
  requestOrThrow(`${serverBaseUrl}/uninstall-client?platform=${platform}`);
}

function resetClient(platform, configuration) {
  requestOrThrow(
    `${serverBaseUrl}/reset-client?platform=${platform}&configuration=${configuration}`
  );
}

function delay(ms) {
  requestOrThrow(`${serverBaseUrl}/delay?ms=${ms}`);
}

function staticFileCount() {
  const response = requestOrThrow(`${serverBaseUrl}/static-file-count`);
  return JSON.parse(response.body).count;
}

function waitForStaticFiles(count, timeoutMs) {
  const params = [];
  if (count !== undefined) {
    params.push(`count=${count}`);
  }
  if (timeoutMs) {
    params.push(`timeout=${timeoutMs}`);
  }
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  const response = requestOrThrow(`${serverBaseUrl}/wait-for-static-files${query}`);
  return JSON.parse(response.body).count;
}

function logEntries() {
  const response = requestOrThrow(`${serverBaseUrl}/log-entries`);
  return JSON.parse(response.body);
}

function waitForLogEntries(timeoutMs, consume) {
  const params = [];
  if (timeoutMs) {
    params.push(`timeout=${timeoutMs}`);
  }
  if (consume === false) {
    params.push('consume=false');
  }
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  const response = requestOrThrow(`${serverBaseUrl}/wait-for-log-entries${query}`);
  return JSON.parse(response.body);
}

function logEntriesWithLevelAndCode(level, code) {
  return logEntries().filter(function (entry) {
    return entry.level === level && entry.code === code;
  });
}

output.api = {
  delay: delay,
  installClient: installClient,
  uninstallClient: uninstallClient,
  resetClient: resetClient,
  lastRequestHeaders: lastRequestHeaders,
  waitForUpdateRequest: waitForUpdateRequest,
  lastAssetRequestHeaders: lastAssetRequestHeaders,
  logEntries: logEntries,
  waitForLogEntries: waitForLogEntries,
  logEntriesWithLevelAndCode: logEntriesWithLevelAndCode,
  restartUpdatesServer: restartUpdatesServer,
  serveManifest: serveManifest,
  staticFileCount: staticFileCount,
  waitForStaticFiles: waitForStaticFiles,
  stopUpdatesServer: stopUpdatesServer,
};
