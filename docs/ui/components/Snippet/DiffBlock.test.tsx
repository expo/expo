import { render, screen } from '@testing-library/react';

import { DiffBlock } from '.';

const DIFF_MOCK = `diff --git a/app.json b/app.json
index 1c3dccb..f281582 100644
--- a/app.json
+++ b/app.json
@@ -1,4 +1,9 @@
 {
   "name": "MyApp",
-  "displayName": "MyApp"
+  "displayName": "MyApp",
+  "expo": {
+    "name": "MyApp",
+    "slug": "my-app",
+    "sdkVersion": "45.0.0"
+  }
 }
\\ No newline at end of file
diff --git a/index.js b/index.js
index a850d03..9d497de 100644
--- a/index.js
+++ b/index.js
@@ -1,9 +1,10 @@
 /**
  * @format
  */
 
+import 'expo-asset';
 import {AppRegistry} from 'react-native';
 import App from './App';
 import {name as appName} from './app.json';
 
 AppRegistry.registerComponent(appName, () => App);
diff --git a/metro.config.js b/metro.config.js
index 13a9642..20ef36e 100644
--- a/metro.config.js
+++ b/metro.config.js
@@ -5,10 +5,11 @@
  * @format
  */
 
 module.exports = {
   transformer: {
+    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
     getTransformOptions: async () => ({
       transform: {
         experimentalImportSupport: false,
         inlineRequires: false,
       },
`;

describe(DiffBlock, () => {
  it('renders diff from file correctly', async () => {
    global.fetch = jest.fn().mockImplementation(() => ({
      ok: true,
      text: async () => DIFF_MOCK,
    }));

    render(<DiffBlock source="/static/diffs/expo-updates-js.diff" />);

    expect(await screen.findByText('app.json')).toBeInTheDocument();
    expect(screen.getByText('index.js')).toBeInTheDocument();
    expect(screen.getByText('metro.config.js')).toBeInTheDocument();

    expect(screen.getByText('"slug": "my-app",')).toBeInTheDocument();
    expect(screen.getByText("import 'expo-asset';")).toBeInTheDocument();
    expect(
      screen.getByText("assetPlugins: ['expo-asset/tools/hashAssetFiles'],")
    ).toBeInTheDocument();
  });

  it('renders raw diff correctly on first render', async () => {
    render(<DiffBlock raw={DIFF_MOCK} />);

    expect(screen.getByText('app.json')).toBeInTheDocument();
    expect(screen.getByText('index.js')).toBeInTheDocument();
    expect(screen.getByText('metro.config.js')).toBeInTheDocument();

    expect(screen.getByText('"slug": "my-app",')).toBeInTheDocument();
    expect(screen.getByText("import 'expo-asset';")).toBeInTheDocument();
    expect(
      screen.getByText("assetPlugins: ['expo-asset/tools/hashAssetFiles'],")
    ).toBeInTheDocument();
  });
});
