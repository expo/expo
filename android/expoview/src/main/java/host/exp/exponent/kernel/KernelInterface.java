// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import de.greenrobot.event.EventBus;
import host.exp.exponent.ExpoUpdatesAppLoader;

public abstract class KernelInterface {

  public abstract void handleError(String errorMessage);
  public abstract void handleError(Exception exception);
  public abstract void openExperience(final KernelConstants.ExperienceOptions options);
  public abstract boolean reloadVisibleExperience(String manifestUrl, boolean forceCache);
  public abstract ExpoUpdatesAppLoader getAppLoaderForManifestUrl(String manifestUrl);

  public boolean reloadVisibleExperience(String manifestUrl) {
    return reloadVisibleExperience(manifestUrl, false);
  }

  private static final Map<String, Set<KernelConstants.ExperienceEvent>> mManifestUrlToEvents = new HashMap<>();

  public void addEventForExperience(String manifestUrl, KernelConstants.ExperienceEvent event) {
    if (!mManifestUrlToEvents.containsKey(manifestUrl)) {
      mManifestUrlToEvents.put(manifestUrl, new HashSet<KernelConstants.ExperienceEvent>());
    }

    mManifestUrlToEvents.get(manifestUrl).add(event);

    EventBus.getDefault().post(new KernelConstants.AddedExperienceEventEvent(manifestUrl));
  }

  public Set<KernelConstants.ExperienceEvent> consumeExperienceEvents(String manifestUrl) {
    Set<KernelConstants.ExperienceEvent> result;
    if (mManifestUrlToEvents.containsKey(manifestUrl)) {
      result = mManifestUrlToEvents.get(manifestUrl);
      mManifestUrlToEvents.remove(manifestUrl);
    } else {
      result = new HashSet<>();
    }

    return result;
  }
}
