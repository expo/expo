"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderIntentFilters;
exports.getIntentFilters = getIntentFilters;
exports.setAndroidIntentFilters = setAndroidIntentFilters;
exports.withAndroidIntentFilters = void 0;

function _androidPlugins() {
  const data = require("../plugins/android-plugins");

  _androidPlugins = function () {
    return data;
  };

  return data;
}

function _Manifest() {
  const data = require("./Manifest");

  _Manifest = function () {
    return data;
  };

  return data;
}

const GENERATED_TAG = 'data-generated';
const withAndroidIntentFilters = (0, _androidPlugins().createAndroidManifestPlugin)(setAndroidIntentFilters, 'withAndroidIntentFilters');
exports.withAndroidIntentFilters = withAndroidIntentFilters;

function getIntentFilters(config) {
  var _config$android$inten, _config$android;

  return (_config$android$inten = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : _config$android.intentFilters) !== null && _config$android$inten !== void 0 ? _config$android$inten : [];
}

function setAndroidIntentFilters(config, androidManifest) {
  var _mainActivity$intent, _mainActivity$intent2;

  // Always ensure old tags are removed.
  const mainActivity = (0, _Manifest().getMainActivityOrThrow)(androidManifest); // Remove all generated tags from previous runs...

  if ((_mainActivity$intent = mainActivity['intent-filter']) !== null && _mainActivity$intent !== void 0 && _mainActivity$intent.length) {
    mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(value => {
      var _value$$;

      return ((_value$$ = value.$) === null || _value$$ === void 0 ? void 0 : _value$$[GENERATED_TAG]) !== 'true';
    });
  }

  const intentFilters = getIntentFilters(config);

  if (!intentFilters.length) {
    return androidManifest;
  }

  mainActivity['intent-filter'] = (_mainActivity$intent2 = mainActivity['intent-filter']) === null || _mainActivity$intent2 === void 0 ? void 0 : _mainActivity$intent2.concat(renderIntentFilters(intentFilters));
  return androidManifest;
}

function renderIntentFilters(intentFilters) {
  return intentFilters.map(intentFilter => {
    // <intent-filter>
    return {
      $: {
        'android:autoVerify': intentFilter.autoVerify ? 'true' : undefined,
        // Add a custom "generated" tag that we can query later to remove.
        [GENERATED_TAG]: 'true'
      },
      action: [// <action android:name="android.intent.action.VIEW"/>
      {
        $: {
          'android:name': `android.intent.action.${intentFilter.action}`
        }
      }],
      data: renderIntentFilterData(intentFilter.data),
      category: renderIntentFilterCategory(intentFilter.category)
    };
  });
}
/** Like `<data android:scheme="exp"/>` */


function renderIntentFilterData(data) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map(datum => ({
    $: Object.entries(datum !== null && datum !== void 0 ? datum : {}).reduce((prev, [key, value]) => ({ ...prev,
      [`android:${key}`]: value
    }), {})
  }));
}
/** Like `<category android:name="android.intent.category.DEFAULT"/>` */


function renderIntentFilterCategory(category) {
  return (Array.isArray(category) ? category : [category]).filter(Boolean).map(cat => ({
    $: {
      'android:name': `android.intent.category.${cat}`
    }
  }));
}
//# sourceMappingURL=IntentFilters.js.map