// Copyright 2015-present 650 Industries. All rights reserved.
'use strict';

const fs = require('fs-extra');
const path = require('path');
const shell = require('shelljs');
const { ExponentTools } = require('xdl');
const crayon = require('@ccheever/crayon');
const JsonFile = require('@exponent/json-file');
const replaceString = require('replace-string');
const _ = require('lodash');
const globby = require('globby');

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

async function regexFileAsync(regex, replace, filename) {
  let file = await fs.promise.readFile(filename);
  let fileString = file.toString();
  await fs.promise.writeFile(filename, fileString.replace(regex, replace));
}

// Matches sed /d behavior
async function deleteLinesInFileAsync(startRegex, endRegex, filename) {
  let file = await fs.promise.readFile(filename);
  let fileString = file.toString();
  let lines = fileString.split(/\r?\n/);
  let filteredLines = [];
  let inDeleteRange = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(startRegex)) {
      inDeleteRange = true;
    }

    if (!inDeleteRange) {
      filteredLines.push(lines[i]);
    }

    if (inDeleteRange && lines[i].match(endRegex)) {
      inDeleteRange = false;
    }
  }
  await fs.promise.writeFile(filename, filteredLines.join('\n'));
}

function xmlWeirdAndroidEscape(original) {
  let noAmps = replaceString(original, '&', '&amp;');
  let noLt = replaceString(noAmps, '<', '&lt;');
  let noGt = replaceString(noLt, '>', '&gt;');
  let noApos = replaceString(noGt, '"', '\\"');
  return replaceString(noApos, "'", "\\'");
}

exports.updateAndroidShellAppAsync = async function updateAndroidShellAppAsync(
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
    releaseChannel,
    outputFile,
  } = args;

  releaseChannel = releaseChannel ? releaseChannel : 'default';
  let manifest = await getManifestAsync(url, {
    'Exponent-SDK-Version': sdkVersion,
    'Exponent-Platform': 'android',
    'Expo-Release-Channel': releaseChannel,
  });

  let fullManifestUrl = `${url.replace('exp://', 'https://')}/index.exp`;
  let bundleUrl = manifest.bundleUrl;

  let shellPath = path.join('..', 'android-shell-app');

  await fs.remove(path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app-manifest.json'));
  await fs.writeFileSync(
    path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app-manifest.json'),
    JSON.stringify(manifest)
  );
  await fs.remove(path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app.bundle'));
  await saveUrlToPathAsync(
    bundleUrl,
    path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app.bundle')
  );

  await deleteLinesInFileAsync(
    `START\ EMBEDDED\ RESPONSES`,
    `END\ EMBEDDED\ RESPONSES`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );

  await regexFileAsync(
    '// ADD EMBEDDED RESPONSES HERE',
    `
    // ADD EMBEDDED RESPONSES HERE
    // START EMBEDDED RESPONSES
    embeddedResponses.add(new EmbeddedResponse("${fullManifestUrl}", "assets://shell-app-manifest.json", "application/json"));
    embeddedResponses.add(new EmbeddedResponse("${bundleUrl}", "assets://shell-app.bundle", "application/javascript"));
    // END EMBEDDED RESPONSES`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );

  await regexFileAsync(
    'RELEASE_CHANNEL = "default"',
    `RELEASE_CHANNEL = "${releaseChannel}"`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );
};

function backgroundImagesForApp(shellPath, manifest) {
  // returns an array like:
  // [
  //   {url: 'urlToDownload', path: 'pathToSaveTo'},
  //   {url: 'anotherURlToDownload', path: 'anotherPathToSaveTo'},
  // ]
  const imageKeys = ['ldpi', 'mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let basePath = path.join(shellPath, 'expoview', 'src', 'main', 'res');
  if (_.get(manifest, 'android.splash')) {
    var splash = _.get(manifest, 'android.splash');
    return _.reduce(
      imageKeys,
      function(acc, imageKey) {
        let url = _.get(splash, `${imageKey}Url`);
        if (url) {
          acc.push({
            url: url,
            path: path.join(basePath, `drawable-${imageKey}`, 'shell_launch_background_image.png'),
          });
        }

        return acc;
      },
      []
    );
  }

  if (_.get(manifest, 'splash.imageUrl')) {
    let url = _.get(manifest, 'splash.imageUrl');
    return [
      {
        url: url,
        path: path.join(basePath, 'drawable-xxxhdpi', 'shell_launch_background_image.png'),
      },
    ];
  }

  return [];
}

function getSplashScreenBackgroundColor(manifest) {
  let backgroundColor;
  if (
    manifest.android &&
    manifest.android.splash &&
    manifest.android.splash.backgroundColor
  ) {
    backgroundColor = manifest.android.splash.backgroundColor;
  } else if (manifest.splash && manifest.splash.backgroundColor) {
    backgroundColor = manifest.splash.backgroundColor;
  }

  // Default to white
  if (!backgroundColor) {
    backgroundColor = '#FFFFFF';
  }
  return backgroundColor;
}

/*
  if resizeMode is 'cover' we should show LoadingView:
  using an ImageView, unlike having a BitmapDrawable
  provides a fullscreen image without distortions
*/
function shouldShowLoadingView(manifest) {
  return (
    (manifest.android &&
      manifest.android.splash &&
      manifest.android.splash.resizeMode &&
      manifest.android.splash.resizeMode === 'cover') ||
    (manifest.splash &&
      manifest.splash.resizeMode &&
      manifest.splash.resizeMode === 'cover')
  );
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
    releaseChannel,
    skipBuild,
  } = args;

  releaseChannel = releaseChannel ? releaseChannel : 'default';
  let manifest = await getManifestAsync(url, {
    'Exponent-SDK-Version': sdkVersion,
    'Exponent-Platform': 'android',
    'Expo-Release-Channel': releaseChannel,
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
  let iconUrl =
    manifest.android && manifest.android.iconUrl
      ? manifest.android.iconUrl
      : manifest.iconUrl;
  let scheme = manifest.scheme;
  let bundleUrl = manifest.bundleUrl;
  let notificationIconUrl = manifest.notification
    ? manifest.notification.iconUrl
    : null;
  let version = manifest.version ? manifest.version : '0.0.0';
  let shellPath = path.join('..', 'android-shell-app');
  let androidSrcPath = path.join('..', 'android');
  let backgroundImages = backgroundImagesForApp(shellPath, manifest);
  let splashBackgroundColor = getSplashScreenBackgroundColor(manifest);
  await fs.remove(shellPath);
  await fs.ensureDir(shellPath);

  // TODO: make this xplat
  await spawnAsync(
    `../../tools-public/generate-dynamic-macros-android.sh`,
    [],
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', 'android', 'app'),
    }
  ); // populate android template files now since we take out the prebuild step later on

  let copyToShellApp = async (fileName) => {
    await fs.copy(path.join(androidSrcPath, fileName), path.join(shellPath, fileName));
  };

  await copyToShellApp('expoview');
  await copyToShellApp('ReactCommon');
  await copyToShellApp('ReactAndroid');
  await copyToShellApp('android.iml');
  await copyToShellApp('app');
  await copyToShellApp('build.gradle');
  await copyToShellApp('gradle');
  await copyToShellApp('gradle.properties');
  await copyToShellApp('gradlew');
  await copyToShellApp('local.properties');
  await copyToShellApp('settings.gradle');
  await copyToShellApp('maven');

  // Clean build directories
  await fs.remove(path.join(shellPath, 'app', 'build'));

  // Package
  await regexFileAsync(
    `applicationId 'host.exp.exponent'`,
    `applicationId '${javaPackage}'`,
    path.join(shellPath, 'app', 'build.gradle')
  );
  await regexFileAsync(
    `android:name="host.exp.exponent"`,
    `android:name="${javaPackage}"`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );

  // Versions
  let buildGradleFile = await fs.readFileSync(
    path.join(shellPath, 'app', 'build.gradle'),
    'utf8'
  );
  let androidVersion = buildGradleFile.match(/versionName '(\S+)'/)[1];
  await regexFileAsync(
    'VERSION_NAME = null',
    `VERSION_NAME = "${androidVersion}"`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );
  await deleteLinesInFileAsync(
    `BEGIN\ VERSIONS`,
    `END\ VERSIONS`,
    path.join(shellPath, 'app', 'build.gradle')
  );
  await regexFileAsync(
    '// ADD VERSIONS HERE',
    `versionCode ${versionCode}
    versionName '${version}'`,
    path.join(shellPath, 'app', 'build.gradle')
  );

  // Remove Exponent build script
  await regexFileAsync(
    `preBuild.dependsOn generateDynamicMacros`,
    ``,
    path.join(shellPath, 'expoview', 'build.gradle')
  );

  // change javaMaxHeapSize
  await regexFileAsync(
    `javaMaxHeapSize "8g"`,
    `javaMaxHeapSize "6g"`,
    path.join(shellPath, 'app', 'build.gradle')
  );

  // Push notifications
  await regexFileAsync(
    '"package_name": "host.exp.exponent"',
    `"package_name": "${javaPackage}"`,
    path.join(shellPath, 'app', 'google-services.json')
  ); // TODO: actually use the correct file

  // TODO: probably don't need this in both places
  await regexFileAsync(
    /host\.exp\.exponent\.permission\.C2D_MESSAGE/g,
    `${javaPackage}.permission.C2D_MESSAGE`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );
  await regexFileAsync(
    /host\.exp\.exponent\.permission\.C2D_MESSAGE/g,
    `${javaPackage}.permission.C2D_MESSAGE`,
    path.join(shellPath, 'expoview', 'src', 'main', 'AndroidManifest.xml')
  );

  // Set INITIAL_URL, SHELL_APP_SCHEME and SHOW_LOADING_VIEW
  await regexFileAsync(
    'INITIAL_URL = null',
    `INITIAL_URL = "${url}"`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );
  if (scheme) {
    await regexFileAsync(
      'SHELL_APP_SCHEME = null',
      `SHELL_APP_SCHEME = "${scheme}"`,
      path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
    );
  }
  if (shouldShowLoadingView(manifest)) {
    await regexFileAsync(
      'SHOW_LOADING_VIEW_IN_SHELL_APP = false',
      'SHOW_LOADING_VIEW_IN_SHELL_APP = true',
      path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
    );
  }

  // App name
  await regexFileAsync(
    '"app_name">Expo',
    `"app_name">${xmlWeirdAndroidEscape(name)}`,
    path.join(shellPath, 'app', 'src', 'main', 'res', 'values', 'strings.xml')
  );

  // Splash Screen background color
  await regexFileAsync(
    '"splashBackground">#FFFFFF',
    `"splashBackground">${splashBackgroundColor}`,
    path.join(shellPath, 'app', 'src', 'main', 'res', 'values', 'colors.xml')
  );

  // show only background color if LoadingView will appear
  if (shouldShowLoadingView(manifest)) {
    await regexFileAsync(
      /<item>.*<\/item>/,
      '',
      path.join(shellPath, 'app', 'src', 'main', 'res', 'drawable', 'splash_background.xml')
    );
  }

  // Remove exp:// scheme from LauncherActivity
  await deleteLinesInFileAsync(
    `START\ LAUNCHER\ INTENT\ FILTERS`,
    `END\ LAUNCHER\ INTENT\ FILTERS`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );

  // Remove LAUNCHER category from HomeActivity
  await deleteLinesInFileAsync(
    `START\ HOME\ INTENT\ FILTERS`,
    `END\ HOME\ INTENT\ FILTERS`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );

  // Add LAUNCHER category to ShellAppActivity
  await regexFileAsync(
    '<!-- ADD SHELL INTENT FILTERS HERE -->',
    `<intent-filter>
      <action android:name="android.intent.action.MAIN"/>

      <category android:name="android.intent.category.LAUNCHER"/>
    </intent-filter>`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );

  // Add shell app scheme
  if (scheme) {
    await regexFileAsync(
      '<!-- ADD SHELL SCHEME HERE -->',
      `<intent-filter>
        <data android:scheme="${scheme}"/>

        <action android:name="android.intent.action.VIEW"/>

        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
      </intent-filter>`,
      path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
    );
  }

  // Add permissions
  if (manifest.android && manifest.android.permissions) {
    const content = await fs.readFileSync(
      path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml'),
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

    await deleteLinesInFileAsync(
      `BEGIN\ OPTIONAL\ PERMISSIONS`,
      `END\ OPTIONAL\ PERMISSIONS`,
      path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
    );

    await regexFileAsync(
      '<!-- ADD PERMISSIONS HERE -->',
      `
      ${whitelist
        .map(p => `<uses-permission android:name="${p}" />`)
        .join('\n')}
      ${blacklist
        .map(p => `<uses-permission android:name="${p}" tools:node="remove" />`)
        .join('\n')}
      `,
      path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
    );
  }

  // OAuth redirect scheme
  await regexFileAsync(
    '<data android:scheme="host.exp.exponent" android:path="oauthredirect"/>',
    `<data android:scheme="${javaPackage}" android:path="oauthredirect"/>`,
    path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
  );

  // Embed manifest and bundle
  await fs.writeFileSync(
    path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app-manifest.json'),
    JSON.stringify(manifest)
  );
  await saveUrlToPathAsync(
    bundleUrl,
    path.join(shellPath, 'app', 'src', 'main', 'assets', 'shell-app.bundle')
  );

  await regexFileAsync(
    '// START EMBEDDED RESPONSES',
    `
    // START EMBEDDED RESPONSES
    embeddedResponses.add(new EmbeddedResponse("${fullManifestUrl}", "assets://shell-app-manifest.json", "application/json"));
    embeddedResponses.add(new EmbeddedResponse("${bundleUrl}", "assets://shell-app.bundle", "application/javascript"));`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );

  await regexFileAsync(
    'RELEASE_CHANNEL = "default"',
    `RELEASE_CHANNEL = "${releaseChannel}"`,
    path.join(shellPath, 'expoview', 'src', 'main', 'java', 'host', 'exp', 'exponent', 'Constants.java')
  );

  // Icon
  if (iconUrl) {
    (await globby(['**/ic_launcher.png'], {
      cwd: path.join(shellPath, 'app', 'src', 'main', 'res'),
      absolute: true,
    })).forEach(filePath => {
      fs.removeSync(filePath);
    });

    await saveUrlToPathAsync(
      iconUrl,
      path.join(shellPath, 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png')
    );

    (await globby(['**/ic_launcher.png'], {
      cwd: path.join(shellPath, 'expoview', 'src', 'main', 'res'),
      absolute: true,
    })).forEach(filePath => {
      fs.removeSync(filePath);
    });
    await saveUrlToPathAsync(
      iconUrl,
      path.join(shellPath, 'expoview', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png')
    );
  }

  if (notificationIconUrl) {
    (await globby(['**/shell_notification_icon.png'], {
      cwd: path.join(shellPath, 'app', 'src', 'main', 'res'),
      absolute: true,
    })).forEach(filePath => {
      fs.removeSync(filePath);
    });

    await saveUrlToPathAsync(
      notificationIconUrl,
      path.join(shellPath, 'app', 'src', 'main', 'res', 'drawable-hdpi', 'shell_notification_icon.png')
    );

    (await globby(['**/shell_notification_icon.png'], {
      cwd: path.join(shellPath, 'expoview', 'src', 'main', 'res'),
      absolute: true,
    })).forEach(filePath => {
      fs.removeSync(filePath);
    });
    await saveUrlToPathAsync(
      notificationIconUrl,
      path.join(shellPath, 'expoview', 'src', 'main', 'res', 'drawable-hdpi', 'shell_notification_icon.png')
    );
  }

  // Splash Background
  if (backgroundImages && backgroundImages.length > 0) {
    // Delete the placeholder images
    (await globby(['**/shell_launch_background_image.png'], {
      cwd: path.join(shellPath, 'expoview', 'src', 'main', 'res'),
      absolute: true,
    })).forEach(filePath => {
      fs.removeSync(filePath);
    });

    _.forEach(backgroundImages, async image => {
      await saveUrlToPathAsync(image.url, image.path);
    });
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
      await regexFileAsync(
        '<!-- ADD BRANCH CONFIG HERE -->',
        `<meta-data
      android:name="io.branch.sdk.BranchKey"
      android:value="${branch.apiKey}"/>`,
        path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
    }

    // Fabric
    if (fabric) {
      await fs.remove(path.join(shellPath, 'app', 'fabric.properties'));
      await fs.writeFileSync(
        path.join(shellPath, 'app', 'fabric.properties'),
        `apiSecret=${fabric.buildSecret}\n`
      );

      await deleteLinesInFileAsync(
        `BEGIN\ FABRIC\ CONFIG`,
        `END\ FABRIC\ CONFIG`,
        path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
      await regexFileAsync(
        '<!-- ADD FABRIC CONFIG HERE -->',
        `<meta-data
      android:name="io.fabric.ApiKey"
      android:value="${fabric.apiKey}"/>`,
        path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
    }

    // Google Maps
    if (googleMaps) {
      await deleteLinesInFileAsync(
        `BEGIN\ GOOGLE\ MAPS\ CONFIG`,
        `END\ GOOGLE\ MAPS\ CONFIG`,
        path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
      await regexFileAsync(
        '<!-- ADD GOOGLE MAPS CONFIG HERE -->',
        `<meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="${googleMaps.apiKey}"/>`,
        path.join(shellPath, 'app', 'src', 'main', 'AndroidManifest.xml')
      );
    }

    // Google Login
    if (googleSignIn) {
      certificateHash = googleSignIn.certificateHash;
      googleAndroidApiKey = googleSignIn.apiKey;
    }
  }

  // Google sign in
  await regexFileAsync(
    /"current_key": "(.*?)"/,
    `"current_key": "${googleAndroidApiKey}"`,
    path.join(shellPath, 'app', 'google-services.json')
  );
  await regexFileAsync(
    /"certificate_hash": "(.*?)"/,
    `"certificate_hash": "${certificateHash}"`,
    path.join(shellPath, 'app', 'google-services.json')
  );

  if (skipBuild) {
    return;
  }

  if (keystore && alias && keystorePassword && keyPassword) {
    try {
      await fs.remove(`shell-unaligned.apk`);
      await fs.remove(`shell.apk`);
    } catch (e) {}
    const gradleArgs = [`assembleProdRelease`];
    if (!!process.env.GRADLE_DAEMON_DISABLED) {
      gradleArgs.unshift('--no-daemon');
    }
    await spawnAsyncThrowError(`./gradlew`, gradleArgs, {
      stdio: 'inherit',
      cwd: shellPath,
    });
    await fs.copy(
      path.join(shellPath, 'app', 'build', 'outputs', 'apk', 'app-prod-release-unsigned.apk'),
      `shell-unaligned.apk`
    );
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
    try {
      await fs.remove('shell-unaligned.apk');
    } catch (e) {}
    await spawnAsync(`jarsigner`, [
      '-verify',
      '-verbose',
      '-certs',
      '-keystore',
      keystore,
      'shell.apk',
    ]);
    await fs.copy(
      'shell.apk',
      outputFile || '/tmp/shell-signed.apk'
    );
  } else {
    await fs.copy(path.join(androidSrcPath, 'debug.keystore'), path.join(shellPath, 'debug.keystore'));
    try {
      await fs.remove('shell-debug.apk');
    } catch (e) {}
    await spawnAsyncThrowError(`./gradlew`, ['assembleDevRemoteKernelDebug'], {
      stdio: 'inherit',
      cwd: shellPath,
    });
    await fs.copy(
      path.join(shellPath, 'app', 'build', 'outputs', 'apk', 'app-devRemoteKernel-debug.apk'),
      `/tmp/shell-debug.apk`
    );
  }
};
