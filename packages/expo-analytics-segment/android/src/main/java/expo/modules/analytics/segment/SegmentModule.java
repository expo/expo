// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.analytics.segment;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.segment.analytics.Analytics;
import com.segment.analytics.Options;
import com.segment.analytics.Properties;
import com.segment.analytics.Traits;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.interfaces.constants.ConstantsInterface;

public class SegmentModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String NAME = "ExponentSegment";
  private static final String ENABLED_PREFERENCE_KEY = "enabled";
  private static final String TAG = SegmentModule.class.getSimpleName();

  private static int sCurrentTag = 0;

  private Context mContext;
  private Analytics mClient;
  private ConstantsInterface mConstants;
  // We have to keep track of `enabled` on our own.
  // Since we have to change tag every time (see commit 083f051), Segment may or may not properly apply
  // remembered preference to the instance. The module in a standalone app would start disabled
  // (settings = { 0 => disabled }, tag = 0) but after OTA update it would reload with
  // (settings = { 0 => disabled }, tag = 1) and segment would become enabled if the app does not
  // disable it on start.
  private SharedPreferences mSharedPreferences;

  public SegmentModule(Context context) {
    super(context);
    mContext = context;
    mSharedPreferences = mContext.getSharedPreferences(NAME, Context.MODE_PRIVATE);
  }

  private static Traits readableMapToTraits(Map<String, Object> properties) {
    Traits traits = new Traits();
    JSONObject json = new JSONObject(properties);
    Iterator<String> iterator = json.keys();
    while (iterator.hasNext()) {
      String key = iterator.next();
      try {
        traits.put(key, json.get(key));
      } catch (JSONException e) {
        Log.e(TAG, e.getMessage());
      }
    }

    return traits;
  }

  private static Properties readableMapToProperties(Map<String, Object> properties) {
    Properties result = new Properties();
    JSONObject json = new JSONObject(properties);
    Iterator<String> iterator = json.keys();
    while (iterator.hasNext()) {
      String key = iterator.next();
      try {
        result.put(key, json.get(key));
      } catch (JSONException e) {
        Log.e(TAG, e.getMessage());
      }
    }

    return result;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ExpoMethod
  public void initializeAndroid(final String writeKey, Promise promise) {
    Analytics.Builder builder = new Analytics.Builder(mContext, writeKey);
    builder.tag(Integer.toString(sCurrentTag++));
    mClient = builder.build();
    mClient.optOut(!getEnabledPreferenceValue());
    promise.resolve(null);
  }

  @ExpoMethod
  public void initializeIOS(final String writeKey, Promise promise) {
    // NO-OP. Need this here because Segment has different keys for iOS and Android.
    promise.reject("E_WRONG_PLATFORM", "Method initializeIOS should not be called on Android, please file an issue on GitHub.");
  }

  @ExpoMethod
  public void identify(final String userId, Promise promise) {
    if (mClient != null) {
      mClient.identify(userId);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void identifyWithTraits(final String userId, final Map<String, Object> properties, Promise promise) {
    if (mClient != null) {
      mClient.identify(userId, readableMapToTraits(properties), new Options());
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void track(final String eventName, Promise promise) {
    if (mClient != null) {
      mClient.track(eventName);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void trackWithProperties(final String eventName, final Map<String, Object> properties, Promise promise) {
    if (mClient != null) {
      mClient.track(eventName, readableMapToProperties(properties));
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void group(final String groupId, Promise promise) {
    if (mClient != null) {
      mClient.group(groupId);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void groupWithTraits(final String groupId, final Map<String, Object> properties, Promise promise) {
    if (mClient != null) {
      mClient.group(groupId, readableMapToTraits(properties), new Options());
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void screen(final String screenName, Promise promise) {
    if (mClient != null) {
      mClient.screen(screenName);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void screenWithProperties(final String screenName, final Map<String, Object> properties, Promise promise) {
    if (mClient != null) {
      mClient.screen(screenName, readableMapToProperties(properties));
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void flush(Promise promise) {
    if (mClient != null) {
      mClient.flush();
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void reset(Promise promise) {
    if (mClient != null) {
      mClient.reset();
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void getEnabledAsync(final Promise promise) {
    promise.resolve(getEnabledPreferenceValue());
  }

  @ExpoMethod
  public void setEnabledAsync(final boolean enabled, final Promise promise) {
    if (mConstants.getAppOwnership().equals("expo")) {
      promise.reject("E_UNSUPPORTED", "Setting Segment's `enabled` is not supported in Expo Client.");
      return;
    }
    mSharedPreferences.edit().putBoolean(ENABLED_PREFERENCE_KEY, enabled).apply();
    if (mClient != null) {
      mClient.optOut(!enabled);
    }
    promise.resolve(null);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mConstants = null;
    if (moduleRegistry != null) {
      mConstants = moduleRegistry.getModule(ConstantsInterface.class);
    }
  }

  private boolean getEnabledPreferenceValue() {
    return mSharedPreferences.getBoolean(ENABLED_PREFERENCE_KEY, true);
  }
}
