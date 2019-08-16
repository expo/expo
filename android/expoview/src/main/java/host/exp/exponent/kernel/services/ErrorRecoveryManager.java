// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.storage.ExponentSharedPreferences;

// todo: Remove this once SDK34 is phased out
public class ErrorRecoveryManager {

  private static final long FIVE_MINUTES_MS = 5 * 60 * 1000;
  private static final long AUTO_RELOAD_BUFFER_BASE_MS = 5 * 1000;

  private static Map<ExperienceId, ErrorRecoveryManager> sExperienceIdToManager = new HashMap<>();
  private static long sTimeAnyExperienceLoaded = 0;

  // This goes up when there are a bunch of errors in succession
  private static long sReloadBufferDepth = 0;

  public static ErrorRecoveryManager getInstance(final ExperienceId experienceId) {
    if (!sExperienceIdToManager.containsKey(experienceId)) {
      sExperienceIdToManager.put(experienceId, new ErrorRecoveryManager(experienceId));
    }

    return sExperienceIdToManager.get(experienceId);
  }

  private ExperienceId mExperienceId;
  private long mTimeLastLoaded = 0;
  private boolean mErrored = false;
  private JSONObject mRecoveryProps;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  public ErrorRecoveryManager(ExperienceId experienceId) {
    mExperienceId = experienceId;
    NativeModuleDepsProvider.getInstance().inject(ErrorRecoveryManager.class, this);
  }

  public void markExperienceLoaded() {
    mTimeLastLoaded = System.currentTimeMillis();
    sTimeAnyExperienceLoaded = mTimeLastLoaded;
    markErrored(false);
  }

  public void setRecoveryProps(JSONObject props) {
    mRecoveryProps = props;
  }

  public JSONObject popRecoveryProps() {
    final JSONObject props = mErrored ? mRecoveryProps : null;
    if (mErrored) {
      sReloadBufferDepth++;
    }
    markErrored(false);
    mRecoveryProps = null;
    return props;
  }

  public void markErrored() {
    markErrored(true);
  }

  public void markErrored(boolean errored) {
    mErrored = errored;
    if (mExperienceId != null) {
      JSONObject metadata = mExponentSharedPreferences.getExperienceMetadata(mExperienceId.get());
      if (metadata == null) {
        metadata = new JSONObject();
      }
      try {
        metadata.put(ExponentSharedPreferences.EXPERIENCE_METADATA_LOADING_ERROR, errored);
        mExponentSharedPreferences.updateExperienceMetadata(mExperienceId.get(), metadata);
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
