const path = require('path');
const fs = require('fs');
const { AndroidShellApp } = require('xdl');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

const SHELL_APP_DIR = path.join(__dirname, '..', '..', 'android-shell-app');

beforeAll(async (done) => {
  await AndroidShellApp.createAndroidShellAppAsync({
    url: 'exp://exp.host/@community/native-component-list',
    sdkVersion: '22.0.0',
    skipBuild: true,
  });
  done();
});

function matchShellAppFile(filePath) {
  let fullPath = path.join(SHELL_APP_DIR, filePath);
  let fileContents = fs.readFileSync(fullPath, 'utf8');
  expect(fileContents).toMatchSnapshot(`shell_app_file_${filePath}`);
}

it('correctly writes app/build.gradle', () => {
  matchShellAppFile(path.join('app', 'build.gradle'));
});

it('correctly writes expoview/build.gradle', () => {
  matchShellAppFile(path.join('expoview', 'build.gradle'));
});

it('correctly writes app/AndroidManifest.xml', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'AndroidManifest.xml'));
});

it('correctly writes expoview/AndroidManifest.xml', () => {
  matchShellAppFile(path.join('expoview', 'src', 'main', 'AndroidManifest.xml'));
});

it('correctly writes Constants.java', () => {
  matchShellAppFile(path.join('expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java'));
});

it('correctly writes google-services.json', () => {
  matchShellAppFile(path.join('app', 'google-services.json'));
});

it('correctly writes strings.xml', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'res', 'values', 'strings.xml'));
});

it('correctly writes colors.xml', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'res', 'values', 'colors.xml'));
});

it('correctly writes splash_background.xml', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'res', 'drawable', 'splash_background.xml'));
});

it('correctly writes shell-app-manifest.json', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'assets', 'shell-app-manifest.json'));
});

// This test causes a Jest RangeError sometimes
/*it('correctly writes shell-app.bundle', () => {
  matchShellAppFile(path.join('app', 'src', 'main', 'assets', 'shell-app.bundle'));
});*/

it('correctly writes fabric.properties', () => {
  matchShellAppFile(path.join('app', 'fabric.properties'));
});
