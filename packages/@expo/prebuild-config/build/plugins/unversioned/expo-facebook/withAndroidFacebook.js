"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFacebookAdvertiserIDCollection = getFacebookAdvertiserIDCollection;
exports.getFacebookAppId = getFacebookAppId;
exports.getFacebookAutoInitEnabled = getFacebookAutoInitEnabled;
exports.getFacebookAutoLogAppEvents = getFacebookAutoLogAppEvents;
exports.getFacebookDisplayName = getFacebookDisplayName;
exports.getFacebookScheme = getFacebookScheme;
exports.setFacebookConfig = setFacebookConfig;
exports.withFacebookManifest = exports.withFacebookAppIdString = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

const {
  buildResourceItem
} = _configPlugins().AndroidConfig.Resources;

const {
  removeStringItem,
  setStringItem
} = _configPlugins().AndroidConfig.Strings;

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  prefixAndroidKeys,
  removeMetaDataItemFromMainApplication
} = _configPlugins().AndroidConfig.Manifest;

const CUSTOM_TAB_ACTIVITY = 'com.facebook.CustomTabActivity';
const STRING_FACEBOOK_APP_ID = 'facebook_app_id';
const META_APP_ID = 'com.facebook.sdk.ApplicationId';
const META_APP_NAME = 'com.facebook.sdk.ApplicationName';
const META_AUTO_INIT = 'com.facebook.sdk.AutoInitEnabled';
const META_AUTO_LOG_APP_EVENTS = 'com.facebook.sdk.AutoLogAppEventsEnabled';
const META_AD_ID_COLLECTION = 'com.facebook.sdk.AdvertiserIDCollectionEnabled';

const withFacebookAppIdString = config => {
  return (0, _configPlugins().withStringsXml)(config, config => {
    config.modResults = applyFacebookAppIdString(config, config.modResults);
    return config;
  });
};

exports.withFacebookAppIdString = withFacebookAppIdString;

const withFacebookManifest = config => {
  return (0, _configPlugins().withAndroidManifest)(config, config => {
    config.modResults = setFacebookConfig(config, config.modResults);
    return config;
  });
};

exports.withFacebookManifest = withFacebookManifest;

function buildXMLItem({
  head,
  children
}) {
  return { ...(children !== null && children !== void 0 ? children : {}),
    $: head
  };
}

function buildAndroidItem(datum) {
  const item = typeof datum === 'string' ? {
    name: datum
  } : datum;
  const head = prefixAndroidKeys(item);
  return buildXMLItem({
    head
  });
}

function getFacebookSchemeActivity(scheme) {
  /**
   <activity
      android:name="com.facebook.CustomTabActivity"
      android:exported="true">
      <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="${scheme}" />
      </intent-filter>
  </activity>
     */
  return buildXMLItem({
    head: prefixAndroidKeys({
      name: CUSTOM_TAB_ACTIVITY,
      exported: 'true'
    }),
    children: {
      'intent-filter': [{
        action: [buildAndroidItem('android.intent.action.VIEW')],
        category: [buildAndroidItem('android.intent.category.DEFAULT'), buildAndroidItem('android.intent.category.BROWSABLE')],
        data: [buildAndroidItem({
          scheme
        })]
      }]
    }
  });
}

function getFacebookScheme(config) {
  var _config$facebookSchem;

  return (_config$facebookSchem = config.facebookScheme) !== null && _config$facebookSchem !== void 0 ? _config$facebookSchem : null;
}

function getFacebookAppId(config) {
  var _config$facebookAppId;

  return (_config$facebookAppId = config.facebookAppId) !== null && _config$facebookAppId !== void 0 ? _config$facebookAppId : null;
}

function getFacebookDisplayName(config) {
  var _config$facebookDispl;

  return (_config$facebookDispl = config.facebookDisplayName) !== null && _config$facebookDispl !== void 0 ? _config$facebookDispl : null;
}

function getFacebookAutoInitEnabled(config) {
  var _config$facebookAutoI;

  return (_config$facebookAutoI = config.facebookAutoInitEnabled) !== null && _config$facebookAutoI !== void 0 ? _config$facebookAutoI : null;
}

function getFacebookAutoLogAppEvents(config) {
  var _config$facebookAutoL;

  return (_config$facebookAutoL = config.facebookAutoLogAppEventsEnabled) !== null && _config$facebookAutoL !== void 0 ? _config$facebookAutoL : null;
}

function getFacebookAdvertiserIDCollection(config) {
  var _config$facebookAdver;

  return (_config$facebookAdver = config.facebookAdvertiserIDCollectionEnabled) !== null && _config$facebookAdver !== void 0 ? _config$facebookAdver : null;
}

function ensureFacebookActivity({
  mainApplication,
  scheme
}) {
  if (Array.isArray(mainApplication.activity)) {
    // Remove all Facebook CustomTabActivities first
    mainApplication.activity = mainApplication.activity.filter(activity => {
      var _activity$$;

      return ((_activity$$ = activity.$) === null || _activity$$ === void 0 ? void 0 : _activity$$['android:name']) !== CUSTOM_TAB_ACTIVITY;
    });
  } else {
    mainApplication.activity = [];
  } // If a new scheme is defined, append it to the activity.


  if (scheme) {
    mainApplication.activity.push(getFacebookSchemeActivity(scheme));
  }

  return mainApplication;
}

function applyFacebookAppIdString(config, stringsJSON) {
  const appId = getFacebookAppId(config);

  if (appId) {
    return setStringItem([buildResourceItem({
      name: STRING_FACEBOOK_APP_ID,
      value: appId
    })], stringsJSON);
  }

  return removeStringItem(STRING_FACEBOOK_APP_ID, stringsJSON);
}

function setFacebookConfig(config, androidManifest) {
  const scheme = getFacebookScheme(config);
  const appId = getFacebookAppId(config);
  const displayName = getFacebookDisplayName(config);
  const autoInitEnabled = getFacebookAutoInitEnabled(config);
  const autoLogAppEvents = getFacebookAutoLogAppEvents(config);
  const advertiserIdCollection = getFacebookAdvertiserIDCollection(config); // eslint-disable-next-line @typescript-eslint/no-unused-vars

  let mainApplication = getMainApplicationOrThrow(androidManifest);
  mainApplication = ensureFacebookActivity({
    scheme,
    mainApplication
  });

  if (appId) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_APP_ID, `@string/${STRING_FACEBOOK_APP_ID}`);
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_APP_ID);
  }

  if (displayName) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_APP_NAME, displayName);
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_APP_NAME);
  }

  if (autoInitEnabled !== null) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_AUTO_INIT, autoInitEnabled ? 'true' : 'false');
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_AUTO_INIT);
  }

  if (autoLogAppEvents !== null) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_AUTO_LOG_APP_EVENTS, autoLogAppEvents ? 'true' : 'false');
  } else {
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_AUTO_LOG_APP_EVENTS);
  }

  if (advertiserIdCollection !== null) {
    mainApplication = addMetaDataItemToMainApplication(mainApplication, META_AD_ID_COLLECTION, advertiserIdCollection ? 'true' : 'false');
  } else {
    // eslint-disable-next-line
    mainApplication = removeMetaDataItemFromMainApplication(mainApplication, META_AD_ID_COLLECTION);
  }

  return androidManifest;
}
//# sourceMappingURL=withAndroidFacebook.js.map