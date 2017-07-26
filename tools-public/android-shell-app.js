// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

require('instapromise');

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const { ExponentTools } = require('xdl');
const crayon = require('@ccheever/crayon');
const JsonFile = require('@exponent/json-file');
const replaceString = require('replace-string');

const {
  getManifestAsync,
  saveUrlToPathAsync,
  spawnAsyncThrowError,
  spawnAsync,
} = ExponentTools;

async function sedInPlaceAsync(...args) {
  const isDarwin = /^darwin/.test(process.platform);
  if (isDarwin) {
    await spawnAsync(`sed`, ['-i', `''`, ...args]);
  } else {
    await spawnAsync(`sed`, ['-i', ...args]);
  }
}

function xmlWeirdAndroidEscape(original) {
  let noAmps = replaceString(original, '&', '&amp;');
  let noLt = replaceString(noAmps, '<', '&lt;');
  let noGt = replaceString(noLt, '>', '&gt;');
  let noApos = replaceString(noGt, '"', '\\"');
  return replaceString(noApos, "'", "\\'");
}

exports.createAndroidShellAppAsync = async function createAndroidShellAppAsync(
  args
) {
  let {
    url,
    sdkVersion,
    androidPackage,
    privateConfigFile,
    keystore,
    alias,
    keystorePassword,
    keyPassword,
    outputFile,
  } = args;

  let manifest = await getManifestAsync(url, {
    'Exponent-SDK-Version': sdkVersion,
    'Exponent-Platform': 'android',
  });

  if (!privateConfigFile) {
    crayon.yellow.warn('Warning: No config file specified.');
  }

  let fullManifestUrl = `${url.replace('exp://', 'https://')}/index.exp`;

  let javaPackage;
  let versionCode = 1;
  if (!manifest.android) {
    javaPackage = androidPackage;
  } else {
    javaPackage = manifest.android.package || androidPackage;
    if (manifest.android.versionCode) {
      versionCode = manifest.android.versionCode;
    }
  }

  if (!javaPackage) {
    throw new Error(
      'Must specify androidPackage option (either from manifest or on command line).'
    );
  }

  let name = manifest.name;
  let iconUrl = manifest.android && manifest.android.iconUrl
    ? manifest.android.iconUrl
    : manifest.iconUrl;
  let scheme = manifest.scheme;
  let bundleUrl = manifest.bundleUrl;
  let notificationIconUrl = manifest.notification
    ? manifest.notification.iconUrl
    : null;
  let version = manifest.version ? manifest.version : '0.0.0';
  let shellPath = '../android-shell-app/';
  await spawnAsync(`/bin/rm`, ['-rf', shellPath]);
  await spawnAsync(`/bin/mkdir`, [shellPath]);
  await spawnAsync(
    `../../tools-public/generate-dynamic-macros-android.sh`,
    [],
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', 'android', 'app'),
    }
  ); // populate android template files now since we take out the prebuild step later on
  await spawnAsync(`/bin/cp`, [
    '-r',
    '../android/expoview',
    `${shellPath}/expoview`,
  ]);
  await spawnAsync(`/bin/cp`, [
    '-r',
    '../android/ReactCommon',
    `${shellPath}/ReactCommon`,
  ]);
  await spawnAsync(`/bin/cp`, [
    '-r',
    '../android/ReactAndroid',
    `${shellPath}/ReactAndroid`,
  ]);
  await spawnAsync(`/bin/cp`, ['../android/android.iml', `${shellPath}/`]);
  await spawnAsync(`/bin/cp`, ['-r', '../android/app', `${shellPath}/app`]);
  await spawnAsync(`/bin/cp`, ['../android/build.gradle', `${shellPath}/`]);
  await spawnAsync(`/bin/cp`, [
    '-r',
    '../android/gradle',
    `${shellPath}/gradle`,
  ]);
  await spawnAsync(`/bin/cp`, [
    '../android/gradle.properties',
    `${shellPath}/`,
  ]);
  await spawnAsync(`/bin/cp`, ['../android/gradlew', `${shellPath}/`]);
  await spawnAsync(`/bin/cp`, ['../android/local.properties', `${shellPath}/`]);
  await spawnAsync(`/bin/cp`, ['../android/settings.gradle', `${shellPath}/`]);
  await spawnAsync(`/bin/cp`, [
    '-r',
    '../android/maven',
    `${shellPath}/maven`,
  ]);

  // Clean build directories
  await spawnAsync(`/bin/rm`, ['-rf', `${shellPath}app/build/`]);

  // Package
  shell.sed(
    '-i',
    `applicationId 'host.exp.exponent'`,
    `applicationId '${javaPackage}'`,
    `${shellPath}app/build.gradle`
  );
  await sedInPlaceAsync(
    '-e',
    `s/android:name="host.exp.exponent"/android:name="${javaPackage}"/g`,
    `${shellPath}app/src/main/AndroidManifest.xml`
  );

  // Versions
  let buildGradleFile = await fs.promise.readFile(
    `${shellPath}app/build.gradle`,
    'utf8'
  );
  let androidVersion = buildGradleFile.match(/versionName '(\S+)'/)[1];
  shell.sed(
    '-i',
    'VERSION_NAME = null',
    `VERSION_NAME = "${androidVersion}"`,
    `${shellPath}expoview/src/main/java/host/exp/exponent/Constants.java`
  );
  await sedInPlaceAsync(
    '-e',
    `/BEGIN\ VERSIONS/,/END\ VERSIONS/d`,
    `${shellPath}app/build.gradle`
  );
  shell.sed(
    '-i',
    '// ADD VERSIONS HERE',
    `versionCode ${versionCode}
    versionName '${version}'`,
    `${shellPath}app/build.gradle`
  );

  // Remove Exponent build script
  shell.sed(
    '-i',
    `preBuild.dependsOn generateDynamicMacros`,
    ``,
    `${shellPath}expoview/build.gradle`
  );

  // change javaMaxHeapSize
  shell.sed(
    '-i',
    `javaMaxHeapSize "8g"`,
    `javaMaxHeapSize "6g"`,
    `${shellPath}app/build.gradle`
  );

  // Push notifications
  shell.sed(
    '-i',
    '"package_name": "host.exp.exponent"',
    `"package_name": "${javaPackage}"`,
    `${shellPath}app/google-services.json`
  ); // TODO: actually use the correct file
  // TODO: probably don't need this in both places
  await sedInPlaceAsync(
    '-e',
    `s/host.exp.exponent.permission.C2D_MESSAGE/${javaPackage}.permission.C2D_MESSAGE/g`,
    `${shellPath}app/src/main/AndroidManifest.xml`
  );
  await sedInPlaceAsync(
    '-e',
    `s/host.exp.exponent.permission.C2D_MESSAGE/${javaPackage}.permission.C2D_MESSAGE/g`,
    `${shellPath}expoview/src/main/AndroidManifest.xml`
  );

  // Set INITIAL_URL and SHELL_APP_SCHEME
  shell.sed(
    '-i',
    'INITIAL_URL = null',
    `INITIAL_URL = "${url}"`,
    `${shellPath}expoview/src/main/java/host/exp/exponent/Constants.java`
  );
  if (scheme) {
    shell.sed(
      '-i',
      'SHELL_APP_SCHEME = null',
      `SHELL_APP_SCHEME = "${scheme}"`,
      `${shellPath}expoview/src/main/java/host/exp/exponent/Constants.java`
    );
  }

  // App name
  shell.sed(
    '-i',
    '"app_name">Expo',
    `"app_name">${xmlWeirdAndroidEscape(name)}`,
    `${shellPath}app/src/main/res/values/strings.xml`
  );

  // Remove exp:// scheme
  await sedInPlaceAsync(
    '-e',
    `/DELETE\ AFTER/,/DELETE\ BEFORE/d`,
    `${shellPath}app/src/main/AndroidManifest.xml`
  );

  // Add shell app scheme
  if (scheme) {
    shell.sed(
      '-i',
      '<!-- ADD SHELL SCHEME HERE -->',
      `<intent-filter>
        <data android:scheme="${scheme}"/>

        <action android:name="android.intent.action.VIEW"/>

        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
      </intent-filter>`,
      `${shellPath}app/src/main/AndroidManifest.xml`
    );
  }

  // Add permissions
  if (manifest.android && manifest.android.permissions) {
    const content = await fs.promise.readFile(
      `${shellPath}app/src/main/AndroidManifest.xml`,
      'utf-8'
    );

    // Get the list of optional permissions form manifest
    const permissions = content
      .replace(
        /(([\s\S]*<!-- BEGIN OPTIONAL PERMISSIONS -->)|(<!-- END OPTIONAL PERMISSIONS -->[\s\S]*))/g,
        ''
      )
      .match(/android:name=".+"/g)
      .map(p => p.replace(/(android:name=|")/g, ''));

    const whitelist = [];

    manifest.android.permissions.forEach(s => {
      if (s.includes('.')) {
        whitelist.push(s);
      } else {
        permissions.forEach(identifier => {
          if (identifier.split('.').pop() === s) {
            whitelist.push(identifier);
          }
        });
      }
    });

    // Permissions we need to remove from the generated manifest
    const blacklist = [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.MANAGE_DOCUMENTS',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_INTERNAL_STORAGE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.RECORD_AUDIO',
      'android.permission.USE_FINGERPRINT',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'com.anddoes.launcher.permission.UPDATE_COUNT',
      'com.android.launcher.permission.INSTALL_SHORTCUT',
      'com.google.android.gms.permission.ACTIVITY_RECOGNITION',
      'com.google.android.providers.gsf.permission.READ_GSERVICES',
      'com.htc.launcher.permission.READ_SETTINGS',
      'com.htc.launcher.permission.UPDATE_SHORTCUT',
      'com.majeur.launcher.permission.UPDATE_BADGE',
      'com.sec.android.provider.badge.permission.READ',
      'com.sec.android.provider.badge.permission.WRITE',
      'com.sonyericsson.home.permission.BROADCAST_BADGE',
    ].filter(p => !whitelist.includes(p));

    await sedInPlaceAsync(
      '-e',
      `/BEGIN\ OPTIONAL\ PERMISSIONS/,/END\ OPTIONAL\ PERMISSIONS/d`,
      `${shellPath}app/src/main/AndroidManifest.xml`
    );

    shell.sed(
      '-i',
      '<!-- ADD PERMISSIONS HERE -->',
      `
      ${whitelist
        .map(p => `<uses-permission android:name="${p}" />`)
        .join('\n')}
      ${blacklist
        .map(p => `<uses-permission android:name="${p}" tools:node="remove" />`)
        .join('\n')}
      `,
      `${shellPath}app/src/main/AndroidManifest.xml`
    );
  }

  // OAuth redirect scheme
  shell.sed(
    '-i',
    '<data android:scheme="host.exp.exponent" android:path="oauthredirect"/>',
    `<data android:scheme="${javaPackage}" android:path="oauthredirect"/>`,
    `${shellPath}app/src/main/AndroidManifest.xml`
  );

  // Embed manifest and bundle
  await fs.promise.writeFile(
    `${shellPath}app/src/main/assets/shell-app-manifest.json`,
    JSON.stringify(manifest)
  );
  await saveUrlToPathAsync(
    bundleUrl,
    `${shellPath}app/src/main/assets/shell-app.bundle`
  );

  shell.sed(
    '-i',
    '// ADD EMBEDDED RESPONSES HERE',
    `
    embeddedResponses.add(new EmbeddedResponse("${fullManifestUrl}", "assets://shell-app-manifest.json", "application/json"));
    embeddedResponses.add(new EmbeddedResponse("${bundleUrl}", "assets://shell-app.bundle", "application/javascript"));`,
    `${shellPath}expoview/src/main/java/host/exp/exponent/Constants.java`
  );

  // Icon
  if (iconUrl) {
    await spawnAsync(`find`, [
      `${shellPath}app/src/main/res`,
      '-iname',
      'ic_launcher.png',
      '-delete',
    ]);
    await saveUrlToPathAsync(
      iconUrl,
      `${shellPath}app/src/main/res/mipmap-hdpi/ic_launcher.png`
    );

    await spawnAsync(`find`, [
      `${shellPath}expoview/src/main/res`,
      '-iname',
      'ic_launcher.png',
      '-delete',
    ]);
    await saveUrlToPathAsync(
      iconUrl,
      `${shellPath}expoview/src/main/res/mipmap-hdpi/ic_launcher.png`
    );
  }

  if (notificationIconUrl) {
    await spawnAsync(`find`, [
      `${shellPath}app/src/main/res`,
      '-iname',
      'shell_notification_icon.png',
      '-delete',
    ]);
    await saveUrlToPathAsync(
      notificationIconUrl,
      `${shellPath}app/src/main/res/drawable-hdpi/shell_notification_icon.png`
    );

    await spawnAsync(`find`, [
      `${shellPath}expoview/src/main/res`,
      '-iname',
      'shell_notification_icon.png',
      '-delete',
    ]);
    await saveUrlToPathAsync(
      notificationIconUrl,
      `${shellPath}expoview/src/main/res/drawable-hdpi/shell_notification_icon.png`
    );
  }

  let certificateHash = '';
  let googleAndroidApiKey = '';
  if (privateConfigFile) {
    let configJsonFile = new JsonFile(privateConfigFile);
    let branch = await configJsonFile.getAsync('branch', null);
    let fabric = await configJsonFile.getAsync('fabric', null);
    let googleMaps = await configJsonFile.getAsync('googleMaps', null);
    let googleSignIn = await configJsonFile.getAsync('googleSignIn', null);

    // Branch
    if (branch) {
      shell.sed(
        '-i',
        '<!-- ADD BRANCH CONFIG HERE -->',
        `<meta-data
      android:name="io.branch.sdk.BranchKey"
      android:value="${branch.apiKey}"/>`,
        `${shellPath}app/src/main/AndroidManifest.xml`
      );
    }

    // Fabric
    if (fabric) {
      await fs.promise.unlink(`${shellPath}app/fabric.properties`);
      await fs.promise.writeFile(
        `${shellPath}app/fabric.properties`,
        `apiSecret=${fabric.buildSecret}\n`
      );

      await sedInPlaceAsync(
        '-e',
        `/BEGIN\ FABRIC\ CONFIG/,/END\ FABRIC\ CONFIG/d`,
        `${shellPath}app/src/main/AndroidManifest.xml`
      );
      shell.sed(
        '-i',
        '<!-- ADD FABRIC CONFIG HERE -->',
        `<meta-data
      android:name="io.fabric.ApiKey"
      android:value="${fabric.apiKey}"/>`,
        `${shellPath}app/src/main/AndroidManifest.xml`
      );
    }

    // Google Maps
    if (googleMaps) {
      await sedInPlaceAsync(
        '-e',
        `/BEGIN\ GOOGLE\ MAPS\ CONFIG/,/END\ GOOGLE\ MAPS\ CONFIG/d`,
        `${shellPath}app/src/main/AndroidManifest.xml`
      );
      shell.sed(
        '-i',
        '<!-- ADD GOOGLE MAPS CONFIG HERE -->',
        `<meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="${googleMaps.apiKey}"/>`,
        `${shellPath}app/src/main/AndroidManifest.xml`
      );
    }

    // Google Login
    if (googleSignIn) {
      certificateHash = googleSignIn.certificateHash;
      googleAndroidApiKey = googleSignIn.apiKey;
    }
  }

  // Google sign in
  shell.sed(
    '-i',
    /"current_key": "(.*?)"/,
    `"current_key": "${googleAndroidApiKey}"`,
    `${shellPath}app/google-services.json`
  );
  shell.sed(
    '-i',
    /"certificate_hash": "(.*?)"/,
    `"certificate_hash": "${certificateHash}"`,
    `${shellPath}app/google-services.json`
  );

  if (keystore && alias && keystorePassword && keyPassword) {
    await spawnAsync(`/bin/rm`, [`shell-unaligned.apk`]);
    await spawnAsync(`/bin/rm`, [`shell.apk`]);
    await spawnAsyncThrowError(`./gradlew`, [`assembleProdRelease`], {
      stdio: 'inherit',
      cwd: shellPath,
    });
    await spawnAsync(`/bin/cp`, [
      `${shellPath}app/build/outputs/apk/app-prod-release-unsigned.apk`,
      `shell-unaligned.apk`,
    ]);
    await spawnAsync(`jarsigner`, [
      '-verbose',
      '-sigalg',
      'SHA1withRSA',
      '-digestalg',
      'SHA1',
      '-storepass',
      keystorePassword,
      '-keypass',
      keyPassword,
      '-keystore',
      keystore,
      'shell-unaligned.apk',
      alias,
    ]);
    await spawnAsync(`zipalign`, [
      '-v',
      '4',
      'shell-unaligned.apk',
      'shell.apk',
    ]);
    await spawnAsync(`/bin/rm`, ['shell-unaligned.apk']);
    await spawnAsync(`jarsigner`, [
      '-verify',
      '-verbose',
      '-certs',
      '-keystore',
      keystore,
      'shell.apk',
    ]);
    await spawnAsyncThrowError(`/bin/cp`, [
      'shell.apk',
      outputFile || '/tmp/shell-signed.apk',
    ]);
  } else {
    await spawnAsync(`/bin/cp`, ['../android/debug.keystore', `${shellPath}/`]);
    await spawnAsync(`/bin/rm`, ['shell-debug.apk']);
    await spawnAsyncThrowError(`./gradlew`, ['assembleDevRemoteKernelDebug'], {
      stdio: 'inherit',
      cwd: shellPath,
    });
    await spawnAsyncThrowError(`/bin/cp`, [
      `${shellPath}app/build/outputs/apk/app-devRemoteKernel-debug.apk`,
      `/tmp/shell-debug.apk`,
    ]);
  }
};
