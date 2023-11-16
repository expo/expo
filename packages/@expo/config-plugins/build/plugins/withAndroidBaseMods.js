"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndroidModFileProviders = exports.withAndroidBaseMods = exports.sortAndroidManifest = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const createBaseMod_1 = require("./createBaseMod");
const android_1 = require("../android");
const XML_1 = require("../utils/XML");
const sortObject_1 = require("../utils/sortObject");
const { readFile, writeFile } = fs_1.promises;
function getAndroidManifestTemplate(config) {
    // Keep in sync with https://github.com/expo/expo/blob/master/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml
    // TODO: Read from remote template when possible
    return (0, XML_1.parseXMLAsync)(`
  <manifest xmlns:android="http://schemas.android.com/apk/res/android" package="${config.android?.package ?? 'com.placeholder.appid'}">

    <uses-permission android:name="android.permission.INTERNET"/>
    <!-- OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
    <!-- These require runtime permissions on M -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
    <!-- END OPTIONAL PERMISSIONS -->

    <queries>
      <!-- Support checking for http(s) links via the Linking API -->
      <intent>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" />
      </intent>
    </queries>

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="true"
    >
      <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="YOUR-APP-URL-HERE"/>
      <meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="YOUR-APP-SDK-VERSION-HERE"/>
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:theme="@style/Theme.App.SplashScreen"
      >
        <intent-filter>
          <action android:name="android.intent.action.MAIN"/>
          <category android:name="android.intent.category.LAUNCHER"/>
        </intent-filter>
      </activity>
      <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>
    </application>
  </manifest>
  `);
}
function sortAndroidManifest(obj) {
    if (obj.manifest) {
        // Reverse sort so application is last and permissions are first
        obj.manifest = (0, sortObject_1.sortObject)(obj.manifest, sortObject_1.reverseSortString);
        if (Array.isArray(obj.manifest['uses-permission'])) {
            // Sort permissions alphabetically
            obj.manifest['uses-permission'].sort((a, b) => {
                if (a.$['android:name'] < b.$['android:name'])
                    return -1;
                if (a.$['android:name'] > b.$['android:name'])
                    return 1;
                return 0;
            });
        }
        if (Array.isArray(obj.manifest.application)) {
            // reverse sort applications so activity is towards the end and meta-data is towards the front.
            obj.manifest.application = obj.manifest.application.map((application) => {
                application = (0, sortObject_1.sortObjWithOrder)(application, ['meta-data', 'service', 'activity']);
                if (Array.isArray(application['meta-data'])) {
                    // Sort metadata alphabetically
                    application['meta-data'].sort((a, b) => {
                        if (a.$['android:name'] < b.$['android:name'])
                            return -1;
                        if (a.$['android:name'] > b.$['android:name'])
                            return 1;
                        return 0;
                    });
                }
                return application;
            });
        }
    }
    return obj;
}
exports.sortAndroidManifest = sortAndroidManifest;
const defaultProviders = {
    dangerous: (0, createBaseMod_1.provider)({
        getFilePath() {
            return '';
        },
        async read() {
            return { filePath: '', modResults: {} };
        },
        async write() { },
    }),
    // Append a rule to supply gradle.properties data to mods on `mods.android.gradleProperties`
    manifest: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        getFilePath({ modRequest: { platformProjectRoot } }) {
            return path_1.default.join(platformProjectRoot, 'app/src/main/AndroidManifest.xml');
        },
        async read(filePath, config) {
            try {
                return await android_1.Manifest.readAndroidManifestAsync(filePath);
            }
            catch (error) {
                if (!config.modRequest.introspect) {
                    throw error;
                }
            }
            return await getAndroidManifestTemplate(config);
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await android_1.Manifest.writeAndroidManifestAsync(filePath, sortAndroidManifest(modResults));
        },
    }),
    // Append a rule to supply gradle.properties data to mods on `mods.android.gradleProperties`
    gradleProperties: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        getFilePath({ modRequest: { platformProjectRoot } }) {
            return path_1.default.join(platformProjectRoot, 'gradle.properties');
        },
        async read(filePath, config) {
            try {
                return await android_1.Properties.parsePropertiesFile(await readFile(filePath, 'utf8'));
            }
            catch (error) {
                if (!config.modRequest.introspect) {
                    throw error;
                }
            }
            return [];
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await writeFile(filePath, android_1.Properties.propertiesListToString(modResults));
        },
    }),
    // Append a rule to supply strings.xml data to mods on `mods.android.strings`
    strings: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath({ modRequest: { projectRoot, introspect } }) {
            try {
                return await android_1.Strings.getProjectStringsXMLPathAsync(projectRoot);
            }
            catch (error) {
                if (!introspect) {
                    throw error;
                }
            }
            return '';
        },
        async read(filePath, config) {
            try {
                return await android_1.Resources.readResourcesXMLAsync({ path: filePath });
            }
            catch (error) {
                if (!config.modRequest.introspect) {
                    throw error;
                }
            }
            return { resources: {} };
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await (0, XML_1.writeXMLAsync)({ path: filePath, xml: modResults });
        },
    }),
    colors: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath({ modRequest: { projectRoot, introspect } }) {
            try {
                return await android_1.Colors.getProjectColorsXMLPathAsync(projectRoot);
            }
            catch (error) {
                if (!introspect) {
                    throw error;
                }
            }
            return '';
        },
        async read(filePath, { modRequest: { introspect } }) {
            try {
                return await android_1.Resources.readResourcesXMLAsync({ path: filePath });
            }
            catch (error) {
                if (!introspect) {
                    throw error;
                }
            }
            return { resources: {} };
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await (0, XML_1.writeXMLAsync)({ path: filePath, xml: modResults });
        },
    }),
    colorsNight: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath({ modRequest: { projectRoot, introspect } }) {
            try {
                return await android_1.Colors.getProjectColorsXMLPathAsync(projectRoot, { kind: 'values-night' });
            }
            catch (error) {
                if (!introspect) {
                    throw error;
                }
            }
            return '';
        },
        async read(filePath, config) {
            try {
                return await android_1.Resources.readResourcesXMLAsync({ path: filePath });
            }
            catch (error) {
                if (!config.modRequest.introspect) {
                    throw error;
                }
            }
            return { resources: {} };
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await (0, XML_1.writeXMLAsync)({ path: filePath, xml: modResults });
        },
    }),
    styles: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath({ modRequest: { projectRoot, introspect } }) {
            try {
                return await android_1.Styles.getProjectStylesXMLPathAsync(projectRoot);
            }
            catch (error) {
                if (!introspect) {
                    throw error;
                }
            }
            return '';
        },
        async read(filePath, config) {
            let styles = { resources: {} };
            try {
                // Adds support for `tools:x`
                styles = await android_1.Resources.readResourcesXMLAsync({
                    path: filePath,
                    fallback: `<?xml version="1.0" encoding="utf-8"?><resources xmlns:tools="http://schemas.android.com/tools"></resources>`,
                });
            }
            catch (error) {
                if (!config.modRequest.introspect) {
                    throw error;
                }
            }
            // Ensure support for tools is added...
            if (!styles.resources.$) {
                styles.resources.$ = {};
            }
            if (!styles.resources.$?.['xmlns:tools']) {
                styles.resources.$['xmlns:tools'] = 'http://schemas.android.com/tools';
            }
            return styles;
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect)
                return;
            await (0, XML_1.writeXMLAsync)({ path: filePath, xml: modResults });
        },
    }),
    projectBuildGradle: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return android_1.Paths.getProjectBuildGradleFilePath(projectRoot);
        },
        async read(filePath) {
            return android_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
    settingsGradle: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return android_1.Paths.getSettingsGradleFilePath(projectRoot);
        },
        async read(filePath) {
            return android_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
    appBuildGradle: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return android_1.Paths.getAppBuildGradleFilePath(projectRoot);
        },
        async read(filePath) {
            return android_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
    mainActivity: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return android_1.Paths.getProjectFilePath(projectRoot, 'MainActivity');
        },
        async read(filePath) {
            return android_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
    mainApplication: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return android_1.Paths.getProjectFilePath(projectRoot, 'MainApplication');
        },
        async read(filePath) {
            return android_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
};
function withAndroidBaseMods(config, { providers, ...props } = {}) {
    return (0, createBaseMod_1.withGeneratedBaseMods)(config, {
        ...props,
        platform: 'android',
        providers: providers ?? getAndroidModFileProviders(),
    });
}
exports.withAndroidBaseMods = withAndroidBaseMods;
function getAndroidModFileProviders() {
    return defaultProviders;
}
exports.getAndroidModFileProviders = getAndroidModFileProviders;
