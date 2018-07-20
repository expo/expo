// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent.modules.api;

import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import com.segment.analytics.Analytics;
import com.segment.analytics.Options;
import com.segment.analytics.Properties;
import com.segment.analytics.Traits;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ScopedContext;
import abi29_0_0.host.exp.exponent.ReadableObjectUtils;

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
    JSONObject json = ReadableObjectUtils.readableToJson(properties);
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
    JSONObject json = ReadableObjectUtils.readableToJson(properties);
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
  public void track(final String eventName) {
    if (mClient != null) {
      mClient.track(eventName);
    }
  }

  @ReactMethod
  public void trackWithProperties(final String eventName, final ReadableMap properties) {
    if (mClient != null) {
      mClient.track(eventName, readableMapToProperties(properties));
    }
  }

  @ReactMethod
  public void group(final String groupId) {
    if (mClient != null) {
      mClient.group(groupId);
    }
  }

  @ReactMethod
  public void groupWithTraits(final String groupId, final ReadableMap properties) {
    if (mClient != null) {
      mClient.group(groupId, readableMapToTraits(properties), new Options());
    }
  }

  @ReactMethod
  public void screen(final String screenName) {
    if (mClient != null) {
      // First parameter is category. We want to fill name to be in line with iOS
      mClient.screen(null, screenName);
    }
  }

  @ReactMethod
  public void screenWithProperties(final String screenName, final ReadableMap properties) {
    if (mClient != null) {
      // First parameter is category. We want to fill name to be in line with iOS
      mClient.screen(null, screenName, readableMapToProperties(properties));
    }
  }

  @ReactMethod
  public void flush() {
    if (mClient != null) {
      mClient.flush();
    }
  }

  @ReactMethod
  public void reset() {
    if (mClient != null) {
      mClient.reset();
    }
  }
}
