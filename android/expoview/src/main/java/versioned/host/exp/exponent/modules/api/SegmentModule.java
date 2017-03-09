// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.segment.analytics.Analytics;
import com.segment.analytics.Options;
import com.segment.analytics.Properties;
import com.segment.analytics.Traits;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.JSONBundleConverter;
import host.exp.exponent.utils.ScopedContext;
import versioned.host.exp.exponent.ReadableObjectUtils;
import versioned.host.exp.exponent.ScopedReactApplicationContext;

public class SegmentModule extends ReactContextBaseJavaModule {

  private static final String TAG = SegmentModule.class.getSimpleName();

  private static int sCurrentTag = 0;

  private ScopedContext mScopedContext;
  private Analytics mClient;

  public SegmentModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
  }

  private static Traits readableMapToTraits(ReadableMap properties) {
    Traits traits = new Traits();
    JSONObject json = ReadableObjectUtils.readableMapToJson(properties);
    Iterator<String> iterator = json.keys();
    while (iterator.hasNext()) {
      String key = iterator.next();
      try {
        traits.put(key, json.get(key));
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    }

    return traits;
  }

  private static Properties readableMapToProperties(ReadableMap properties) {
    Properties result = new Properties();
    JSONObject json = ReadableObjectUtils.readableMapToJson(properties);
    Iterator<String> iterator = json.keys();
    while (iterator.hasNext()) {
      String key = iterator.next();
      try {
        result.put(key, json.get(key));
      } catch (JSONException e) {
        EXL.e(TAG, e);
      }
    }

    return result;
  }

  @Override
  public String getName() {
    return "ExponentSegment";
  }

  @ReactMethod
  public void initializeAndroid(final String writeKey) {
    Analytics.Builder builder = new Analytics.Builder(mScopedContext, writeKey);
    builder.tag(Integer.toString(sCurrentTag++));
    mClient = builder.build();
  }

  @ReactMethod
  public void initializeIOS(final String writeKey) {
    // NO-OP. Need this here because Segment has different keys for iOS and Android.
  }

  @ReactMethod
  public void identify(final String userId) {
    if (mClient != null) {
      mClient.identify(userId);
    }
  }

  @ReactMethod
  public void identifyWithTraits(final String userId, final ReadableMap properties) {
    if (mClient != null) {
      mClient.identify(userId, readableMapToTraits(properties), new Options());
    }
  }

  @ReactMethod
  public void track(final String event) {
    if (mClient != null) {
      mClient.track(event);
    }
  }

  @ReactMethod
  public void trackWithProperties(final String eventName, final ReadableMap properties) {
    if (mClient != null) {
      mClient.track(eventName, readableMapToProperties(properties));
    }
  }

  @ReactMethod
  public void flush() {
    if (mClient != null) {
      mClient.flush();
    }
  }
}
