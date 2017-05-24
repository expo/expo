// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import host.exp.exponent.kernel.ExperienceId;

public class ErrorRecoveryManager {

  private static final long FIVE_MINUTES_MS = 5 * 60 * 1000;
  private static final long AUTO_RELOAD_BUFFER_BASE_MS = 5 * 1000;

  private static Map<ExperienceId, ErrorRecoveryManager> sExperienceIdToManager = new HashMap<>();
  private static long sTimeAnyExperienceLoaded = 0;

  // This goes up when there are a bunch of errors in succession
  private static long sReloadBufferDepth = 0;

  public static ErrorRecoveryManager getInstance(final ExperienceId experienceId) {
    if (!sExperienceIdToManager.containsKey(experienceId)) {
      sExperienceIdToManager.put(experienceId, new ErrorRecoveryManager());
    }

    return sExperienceIdToManager.get(experienceId);
  }

  private long mTimeLastLoaded = 0;
  private boolean mErrored = false;
  private JSONObject mRecoveryProps;

  public void markExperienceLoaded() {
    mTimeLastLoaded = System.currentTimeMillis();
    sTimeAnyExperienceLoaded = mTimeLastLoaded;
    mErrored = false;
  }

  public void setRecoveryProps(JSONObject props) {
    mRecoveryProps = props;
  }

  public JSONObject popRecoveryProps() {
    final JSONObject props = mErrored ? mRecoveryProps : null;
    if (mErrored) {
      sReloadBufferDepth++;
    }
    mErrored = false;
    mRecoveryProps = null;
    return props;
  }

  public void markErrored() {
    mErrored = true;
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
