// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ErrorRecoveryManager {

  private static final long FIVE_MINUTES_MS = 5 * 60 * 1000;
  private static final long AUTO_RELOAD_BUFFER_BASE_MS = 5 * 1000;

  private static Map<String, ErrorRecoveryManager> sExperienceScopeKeyToManager = new HashMap<>();
  private static long sTimeAnyExperienceLoaded = 0;

  // This goes up when there are a bunch of errors in succession
  private static long sReloadBufferDepth = 0;

  public static ErrorRecoveryManager getInstance(final ExperienceKey experienceKey) {
    if (!sExperienceScopeKeyToManager.containsKey(experienceKey.getScopeKey())) {
      sExperienceScopeKeyToManager.put(experienceKey.getScopeKey(), new ErrorRecoveryManager(experienceKey));
    }

    return sExperienceScopeKeyToManager.get(experienceKey.getScopeKey());
  }

  private ExperienceKey mExperienceKey;
  private long mTimeLastLoaded = 0;
  private boolean mErrored = false;
  private JSONObject mRecoveryProps;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public ErrorRecoveryManager(ExperienceKey experienceKey) {
    mExperienceKey = experienceKey;
    NativeModuleDepsProvider.getInstance().inject(ErrorRecoveryManager.class, this);
  }

  public void markExperienceLoaded() {
    mTimeLastLoaded = System.currentTimeMillis();
    sTimeAnyExperienceLoaded = mTimeLastLoaded;
    markErrored(false);
  }

  public void markErrored() {
    markErrored(true);
  }

  public void markErrored(boolean errored) {
    mErrored = errored;
    if (mExperienceKey != null) {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(mExperienceKey);
      if (metadata == null) {
        metadata = new JSONObject();
      }
      try {
        metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR, errored);
        mExponentSharedPreferences.updateExperienceMetadata(mExperienceKey, metadata);
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }
  }

  public boolean shouldReloadOnError() {
    long diff = System.currentTimeMillis() - mTimeLastLoaded;
    long reloadBuffer = reloadBuffer();
    return diff >= reloadBuffer;
  }

  private long reloadBuffer() {
    long interval = Math.min(FIVE_MINUTES_MS, (long) (AUTO_RELOAD_BUFFER_BASE_MS * Math.pow(1.5, sReloadBufferDepth)));
    long timeSinceLastExperienceLoaded = System.currentTimeMillis() - sTimeAnyExperienceLoaded;

    if (timeSinceLastExperienceLoaded > interval * 2) {
      sReloadBufferDepth = 0;
      interval = AUTO_RELOAD_BUFFER_BASE_MS;
    }

    return interval;
  }
}
