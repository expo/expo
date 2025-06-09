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
const withScheme = exports.withScheme = (0, _androidPlugins().createAndroidManifestPlugin)(setScheme, 'withScheme');
function getScheme(config) {
  if (Array.isArray(config.scheme)) {
    const validate = value => typeof value === 'string';
    return config.scheme.filter(validate);
  } else if (typeof config.scheme === 'string') {
    return [config.scheme];
  }
  return [];
}

// This plugin used to remove the unused schemes but this is unpredictable because other plugins could add schemes.
// The only way to reliably remove schemes from the project is to nuke the file and regenerate the code (`npx expo prebuild --clean`).
// Regardless, having extra schemes isn't a fatal issue and therefore a tolerable compromise is to just add new schemes that aren't currently present.
function setScheme(config, androidManifest) {
  const schemes = [...getScheme(config), ...getScheme(config.android ?? {})];
  if (schemes.length === 0) {
    return androidManifest;
  }
  if (!ensureManifestHasValidIntentFilter(androidManifest)) {
    (0, _warnings().addWarningAndroid)('scheme', `Cannot add schemes because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\``, 'https://expo.fyi/setup-android-uri-scheme');
    return androidManifest;
  }

  // Get the current schemes and remove them from the list of schemes to add.
  const currentSchemes = getSchemesFromManifest(androidManifest);
  for (const uri of currentSchemes) {
    const index = schemes.indexOf(uri);
    if (index > -1) schemes.splice(index, 1);
  }

  // Now add all of the remaining schemes.
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
  const actions = intentFilter?.action?.map(data => data?.$?.['android:name']) ?? [];
  const categories = intentFilter?.category?.map(data => data?.$?.['android:name']) ?? [];
  const data = intentFilter?.data?.filter(data => data?.$?.['android:scheme'])?.map(data => ({
    scheme: data?.$?.['android:scheme'],
    host: data?.$?.['android:host']
  })) ?? [];
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
    } = application;
    // @ts-ignore
    const activities = Array.isArray(activity) ? activity : [activity];
    const singleTaskActivities = activities.filter(activity => activity?.$?.['android:launchMode'] === 'singleTask');
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
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
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
  if (!ensureManifestHasValidIntentFilter(androidManifest)) {
    (0, _warnings().addWarningAndroid)('scheme', `Cannot add schemes because the provided manifest does not have a valid Activity with \`android:launchMode="singleTask"\``, 'https://expo.fyi/setup-android-uri-scheme');
    return androidManifest;
  }
  for (const application of androidManifest.manifest.application) {
    for (const activity of application.activity || []) {
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
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
      if (activity?.$?.['android:launchMode'] === 'singleTask') {
        for (const intentFilter of activity['intent-filter'] || []) {
          // Parse valid intent filters...
          const properties = propertiesFromIntentFilter(intentFilter);
          if (isValidRedirectIntentFilter(properties)) {
            for (const dataKey in intentFilter?.data || []) {
              const data = intentFilter.data?.[dataKey];
              if (data?.$?.['android:scheme'] === scheme) {
                delete intentFilter.data?.[dataKey];
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