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
exports.setFacebookAdvertiserIDCollectionEnabled = setFacebookAdvertiserIDCollectionEnabled;
exports.setFacebookAppId = setFacebookAppId;
exports.setFacebookApplicationQuerySchemes = setFacebookApplicationQuerySchemes;
exports.setFacebookAutoInitEnabled = setFacebookAutoInitEnabled;
exports.setFacebookAutoLogAppEventsEnabled = setFacebookAutoLogAppEventsEnabled;
exports.setFacebookConfig = setFacebookConfig;
exports.setFacebookDisplayName = setFacebookDisplayName;
exports.setFacebookScheme = setFacebookScheme;
exports.withIosFacebook = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

const {
  appendScheme
} = _configPlugins().IOSConfig.Scheme;

const fbSchemes = ['fbapi', 'fb-messenger-api', 'fbauth2', 'fbshareextension'];

const withIosFacebook = config => {
  return (0, _configPlugins().withInfoPlist)(config, config => {
    config.modResults = setFacebookConfig(config, config.modResults);
    return config;
  });
};
/**
 * Getters
 * TODO: these getters are the same between ios/android, we could reuse them
 */


exports.withIosFacebook = withIosFacebook;

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
/**
 * Setters
 */


function setFacebookConfig(config, infoPlist) {
  infoPlist = setFacebookAppId(config, infoPlist);
  infoPlist = setFacebookApplicationQuerySchemes(config, infoPlist);
  infoPlist = setFacebookDisplayName(config, infoPlist);
  infoPlist = setFacebookAutoInitEnabled(config, infoPlist);
  infoPlist = setFacebookAutoLogAppEventsEnabled(config, infoPlist);
  infoPlist = setFacebookAdvertiserIDCollectionEnabled(config, infoPlist);
  infoPlist = setFacebookScheme(config, infoPlist);
  return infoPlist;
}

function setFacebookScheme(config, infoPlist) {
  const facebookScheme = getFacebookScheme(config);
  return appendScheme(facebookScheme, infoPlist);
}

function setFacebookAutoInitEnabled(config, {
  FacebookAutoInitEnabled,
  ...infoPlist
}) {
  const facebookAutoInitEnabled = getFacebookAutoInitEnabled(config);

  if (facebookAutoInitEnabled === null) {
    return infoPlist;
  }

  return { ...infoPlist,
    FacebookAutoInitEnabled: facebookAutoInitEnabled
  };
}

function setFacebookAutoLogAppEventsEnabled(config, {
  FacebookAutoLogAppEventsEnabled,
  ...infoPlist
}) {
  const facebookAutoLogAppEventsEnabled = getFacebookAutoLogAppEvents(config);

  if (facebookAutoLogAppEventsEnabled === null) {
    return infoPlist;
  }

  return { ...infoPlist,
    FacebookAutoLogAppEventsEnabled: facebookAutoLogAppEventsEnabled
  };
}

function setFacebookAdvertiserIDCollectionEnabled(config, {
  FacebookAdvertiserIDCollectionEnabled,
  ...infoPlist
}) {
  const facebookAdvertiserIDCollectionEnabled = getFacebookAdvertiserIDCollection(config);

  if (facebookAdvertiserIDCollectionEnabled === null) {
    return infoPlist;
  }

  return { ...infoPlist,
    FacebookAdvertiserIDCollectionEnabled: facebookAdvertiserIDCollectionEnabled
  };
}

function setFacebookAppId(config, {
  FacebookAppID,
  ...infoPlist
}) {
  const facebookAppId = getFacebookAppId(config);

  if (facebookAppId) {
    return { ...infoPlist,
      FacebookAppID: facebookAppId
    };
  }

  return infoPlist;
}

function setFacebookDisplayName(config, {
  FacebookDisplayName,
  ...infoPlist
}) {
  const facebookDisplayName = getFacebookDisplayName(config);

  if (facebookDisplayName) {
    return { ...infoPlist,
      FacebookDisplayName: facebookDisplayName
    };
  }

  return infoPlist;
}

function setFacebookApplicationQuerySchemes(config, infoPlist) {
  const facebookAppId = getFacebookAppId(config);
  const existingSchemes = infoPlist.LSApplicationQueriesSchemes || [];

  if (facebookAppId && existingSchemes.includes('fbapi')) {
    // already included, no need to add again
    return infoPlist;
  } else if (!facebookAppId && !existingSchemes.length) {
    // already removed, no need to strip again
    const {
      LSApplicationQueriesSchemes,
      ...restInfoPlist
    } = infoPlist;

    if (LSApplicationQueriesSchemes !== null && LSApplicationQueriesSchemes !== void 0 && LSApplicationQueriesSchemes.length) {
      return infoPlist;
    } else {
      // Return without the empty LSApplicationQueriesSchemes array.
      return restInfoPlist;
    }
  } // Remove all schemes


  for (const scheme of fbSchemes) {
    const index = existingSchemes.findIndex(s => s === scheme);

    if (index > -1) {
      existingSchemes.splice(index, 1);
    }
  }

  if (!facebookAppId) {
    // Run again to ensure the LSApplicationQueriesSchemes array is stripped if needed.
    infoPlist.LSApplicationQueriesSchemes = existingSchemes;

    if (!infoPlist.LSApplicationQueriesSchemes.length) {
      delete infoPlist.LSApplicationQueriesSchemes;
    }

    return infoPlist;
  } // TODO: it's actually necessary to add more query schemes (specific to the
  // app) to support all of the features that the Facebook SDK provides, should
  // we sync those here too?


  const updatedSchemes = [...existingSchemes, ...fbSchemes];
  return { ...infoPlist,
    LSApplicationQueriesSchemes: updatedSchemes
  };
}
//# sourceMappingURL=withIosFacebook.js.map