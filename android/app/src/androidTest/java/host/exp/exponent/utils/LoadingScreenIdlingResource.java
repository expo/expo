// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.support.test.espresso.IdlingResource;

import de.greenrobot.event.EventBus;
import host.exp.exponent.experience.BaseExperienceActivity;

public class LoadingScreenIdlingResource implements IdlingResource {

  private ResourceCallback mResourceCallback;
  long startTime;

  public LoadingScreenIdlingResource() {
    this.startTime = System.currentTimeMillis();

    EventBus.getDefault().register(this);
  }

  public void onEvent(BaseExperienceActivity.ExperienceDoneLoadingEvent event) {
    if (mResourceCallback != null) {
      mResourceCallback.onTransitionToIdle();
    }
  }

  @Override
  public String getName() {
    return LoadingScreenIdlingResource.class.getName();
  }

  @Override
  public boolean isIdleNow() {
    if (BaseExperienceActivity.getVisibleActivity() == null) {
      return false;
    }

    boolean isIdle = !BaseExperienceActivity.getVisibleActivity().isLoading();
    if (isIdle && mResourceCallback != null) {
      mResourceCallback.onTransitionToIdle();
    }
    return isIdle;
  }

  @Override
  public void registerIdleTransitionCallback(ResourceCallback callback) {
    mResourceCallback = callback;
  }
}
