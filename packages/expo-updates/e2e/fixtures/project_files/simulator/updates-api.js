// Evaluates a JavaScript expression for an updates E2E flow, with the same `output.api` functions
// as maestro/tests/maestroUpdatesApi.js.
//
// Usage: node simulator/updates-api.js <expression>
//
// The expression can read `copiedText` (the last text that lib.sh read from the app) and can read
// and write `output`, which lib.sh keeps in OUTPUT_STATE_FILE between calls. A string result is
// printed as it is; any other result is printed as JSON.

const { execFileSync } = require('child_process');
const fs = require('fs');

const serverBaseUrl = `http://localhost:${process.env.UPDATES_SERVER_PORT}`;
const stateFile = process.env.OUTPUT_STATE_FILE;

function get(path) {
  return execFileSync('curl', ['--fail', '--silent', '--show-error', `${serverBaseUrl}/${path}`], {
    encoding: 'utf8',
  });
}

function serveManifest(name, platform, channel) {
  let path = `serve-manifest?name=${name}&platform=${platform}`;
  if (channel) {
    path += `&channel=${encodeURIComponent(channel)}`;
  }
  return get(path);
}

function logEntries() {
  return JSON.parse(get('log-entries'));
}

const api = {
  lastRequestHeaders: () => JSON.parse(get('last-request-headers')),
  lastAssetRequestHeaders: () => JSON.parse(get('last-asset-request-headers')),
  logEntries,
  logEntriesWithLevelAndCode: (level, code) =>
    logEntries().filter((entry) => entry.level === level && entry.code === code),
  serveManifest,
  staticFileCount: () => JSON.parse(get('static-file-count')).count,
};

const output = stateFile && fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile)) : {};
const copiedText = process.env.COPIED_TEXT;

const result = new Function('output', 'api', 'copiedText', `return (${process.argv[2]});`)(
  output,
  api,
  copiedText
);

if (stateFile) {
  fs.writeFileSync(stateFile, JSON.stringify(output));
}
if (result !== undefined) {
  console.log(typeof result === 'string' ? result : JSON.stringify(result));
}
