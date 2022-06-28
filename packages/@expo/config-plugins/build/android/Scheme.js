"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendScheme = appendScheme;
exports.ensureManifestHasValidIntentFilter = ensureManifestHasValidIntentFilter;
exports.getScheme = getScheme;
exports.getSchemesFromManifest = getSchemesFromManifest;
exports.hasScheme = hasScheme;
exports.removeScheme = removeScheme;
exports.setScheme = setScheme;
exports.withScheme = void 0;

function _androidPlugins() {
  const data = require("../plugins/android-plugins");

  _androidPlugins = function () {
    return data;
  };

  return data;
}

function _warnings() {
  const data = require("../utils/warnings");

  _warnings = function () {
    return data;
  };

  return data;
}

const withScheme = (0, _androidPlugins().createAndroidManifestPlugin)(setScheme, 'withScheme');
exports.withScheme = withScheme;

function getScheme(config) {
  if (Array.isArray(config.scheme)) {
    const validate = value => typeof value === 'string';

    return config.scheme.filter(validate);
  } else if (typeof config.scheme === 'string') {
    return [config.scheme];
  }

  return [];
} // This plugin used to remove the unused schemes but this is unpredictable because other plugins could add schemes.
// The only way to reliably remove schemes from the project is to nuke the file and regenerate the code (`expo prebuild --clean`).
// Regardless, having extra schemes isn't a fatal issue and therefore a tolerable compromise is to just add new schemes that aren't currently present.


function setScheme(config, androidManifest) {
  var _config$android, _config$android2;

  const schemes = [...getScheme(config), // @ts-ignore: TODO: android.scheme is an unreleased -- harder to add to turtle v1.
  ...getScheme((_config$android = config.android) !== null && _config$android !== void 0 ? _config$android : {})]; // Add the package name to the list of schemes for easier Google auth and parity with Turtle v1.

  if ((_config$android2 = config.android) !== null && _config$android2 !== void 0 && _config$android2.package) {
    schemes.push(config.android.package);
  }

  if (schemes.length === 0) {
    return androidManifest;
  }

  if (!ensureManifestHasValidIntentFilter(androidManifest)) {
    (0, _warnings().addWarningAndroid)('scheme', `Cannot add schemes because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\``, 'https://expo.fyi/setup-android-uri-scheme');
    return androidManifest;
  } // Get the current schemes and remove them from the list of schemes to add.


  const currentSchemes = getSchemesFromManifest(androidManifest);

  for (const uri of currentSchemes) {
    const index = schemes.indexOf(uri);
    if (index > -1) schemes.splice(index, 1);
  } // Now add all of the remaining schemes.


  for (const uri of schemes) {
    androidManifest = appendScheme(uri, androidManifest);
  }

  return androidManifest;
}

function isValidRedirectIntentFilter({
  actions,
  categories
}) {
  return actions.includes('android.intent.action.VIEW') && !categories.includes('android.intent.category.LAUNCHER');
}

function propertiesFromIntentFilter(intentFilter) {
  var _intentFilter$action$, _intentFilter$action, _intentFilter$categor, _intentFilter$categor2, _intentFilter$data$fi, _intentFilter$data, _intentFilter$data$fi2;

  const actions = (_intentFilter$action$ = intentFilter === null || intentFilter === void 0 ? void 0 : (_intentFilter$action = intentFilter.action) === null || _intentFilter$action === void 0 ? void 0 : _intentFilter$action.map(data => {
    var _data$$;

    return data === null || data === void 0 ? void 0 : (_data$$ = data.$) === null || _data$$ === void 0 ? void 0 : _data$$['android:name'];
  })) !== null && _intentFilter$action$ !== void 0 ? _intentFilter$action$ : [];
  const categories = (_intentFilter$categor = intentFilter === null || intentFilter === void 0 ? void 0 : (_intentFilter$categor2 = intentFilter.category) === null || _intentFilter$categor2 === void 0 ? void 0 : _intentFilter$categor2.map(data => {
    var _data$$2;

    return data === null || data === void 0 ? void 0 : (_data$$2 = data.$) === null || _data$$2 === void 0 ? void 0 : _data$$2['android:name'];
  })) !== null && _intentFilter$categor !== void 0 ? _intentFilter$categor : [];
  const data = (_intentFilter$data$fi = intentFilter === null || intentFilter === void 0 ? void 0 : (_intentFilter$data = intentFilter.data) === null || _intentFilter$data === void 0 ? void 0 : (_intentFilter$data$fi2 = _intentFilter$data.filter(data => {
    var _data$$3;

    return data === null || data === void 0 ? void 0 : (_data$$3 = data.$) === null || _data$$3 === void 0 ? void 0 : _data$$3['android:scheme'];
  })) === null || _intentFilter$data$fi2 === void 0 ? void 0 : _intentFilter$data$fi2.map(data => {
    var _data$$4, _data$$5;

    return {
      scheme: data === null || data === void 0 ? void 0 : (_data$$4 = data.$) === null || _data$$4 === void 0 ? void 0 : _data$$4['android:scheme'],
      host: data === null || data === void 0 ? void 0 : (_data$$5 = data.$) === null || _data$$5 === void 0 ? void 0 : _data$$5['android:host']
    };
  })) !== null && _intentFilter$data$fi !== void 0 ? _intentFilter$data$fi : [];
  return {
    actions,
    categories,
    data
  };
}

function getSingleTaskIntentFilters(androidManifest) {
  if (!Array.isArray(androidManifest.manifest.application)) return [];
  let outputSchemes = [];

  for (const application of androidManifest.manifest.application) {
    const {
      activity
    } = application; // @ts-ignore

    const activities = Array.isArray(activity) ? activity : [activity];
    const singleTaskActivities = activities.filter(activity => {
      var _activity$$;

      return (activity === null || activity === void 0 ? void 0 : (_activity$$ = activity.$) === null || _activity$$ === void 0 ? void 0 : _activity$$['android:launchMode']) === 'singleTask';
    });

    for (const activity of singleTaskActivities) {
      const intentFilters = activity['intent-filter'];
      outputSchemes = outputSchemes.concat(intentFilters);
    }
  }

  return outputSchemes;
}

function getSchemesFromManifest(androidManifest, requestedHost = null) {
  const outputSchemes = [];
  const singleTaskIntentFilters = getSingleTaskIntentFilters(androidManifest);

  for (const intentFilter of singleTaskIntentFilters) {
    const properties = propertiesFromIntentFilter(intentFilter);

    if (isValidRedirectIntentFilter(properties) && properties.data) {
      for (const {
        scheme,
        host
      } of properties.data) {
        if (requestedHost === null || !host || host === requestedHost) {
          outputSchemes.push(scheme);
        }
      }
    }
  }

  return outputSchemes;
}

function ensureManifestHasValidIntentFilter(androidManifest) {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return false;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      var _activity$$2;

      if ((activity === null || activity === void 0 ? void 0 : (_activity$$2 = activity.$) === null || _activity$$2 === void 0 ? void 0 : _activity$$2['android:launchMode']) === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          // Parse valid intent filters...
          const properties = propertiesFromIntentFilter(intentFilter);

          if (isValidRedirectIntentFilter(properties)) {
            return true;
          }
        }

        if (!activity['intent-filter']) {
          activity['intent-filter'] = [];
        }

        activity['intent-filter'].push({
          action: [{
            $: {
              'android:name': 'android.intent.action.VIEW'
            }
          }],
          category: [{
            $: {
              'android:name': 'android.intent.category.DEFAULT'
            }
          }, {
            $: {
              'android:name': 'android.intent.category.BROWSABLE'
            }
          }]
        });
        return true;
      }
    }
  }

  return false;
}

function hasScheme(scheme, androidManifest) {
  const schemes = getSchemesFromManifest(androidManifest);
  return schemes.includes(scheme);
}

function appendScheme(scheme, androidManifest) {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return androidManifest;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      var _activity$$3;

      if ((activity === null || activity === void 0 ? void 0 : (_activity$$3 = activity.$) === null || _activity$$3 === void 0 ? void 0 : _activity$$3['android:launchMode']) === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          const properties = propertiesFromIntentFilter(intentFilter);

          if (isValidRedirectIntentFilter(properties)) {
            if (!intentFilter.data) intentFilter.data = [];
            intentFilter.data.push({
              $: {
                'android:scheme': scheme
              }
            });
          }
        }

        break;
      }
    }
  }

  return androidManifest;
}

function removeScheme(scheme, androidManifest) {
  if (!Array.isArray(androidManifest.manifest.application)) {
    return androidManifest;
  }

  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      var _activity$$4;

      if ((activity === null || activity === void 0 ? void 0 : (_activity$$4 = activity.$) === null || _activity$$4 === void 0 ? void 0 : _activity$$4['android:launchMode']) === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          // Parse valid intent filters...
          const properties = propertiesFromIntentFilter(intentFilter);

          if (isValidRedirectIntentFilter(properties)) {
            for (const dataKey in (intentFilter === null || intentFilter === void 0 ? void 0 : intentFilter.data) || []) {
              var _intentFilter$data2, _data$$6;

              const data = (_intentFilter$data2 = intentFilter.data) === null || _intentFilter$data2 === void 0 ? void 0 : _intentFilter$data2[dataKey];

              if ((data === null || data === void 0 ? void 0 : (_data$$6 = data.$) === null || _data$$6 === void 0 ? void 0 : _data$$6['android:scheme']) === scheme) {
                var _intentFilter$data3;

                (_intentFilter$data3 = intentFilter.data) === null || _intentFilter$data3 === void 0 ? true : delete _intentFilter$data3[dataKey];
              }
            }
          }
        }

        break;
      }
    }
  }

  return androidManifest;
}
//# sourceMappingURL=Scheme.js.map