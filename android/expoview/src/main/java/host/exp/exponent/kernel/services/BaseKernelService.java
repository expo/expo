// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import android.content.Context;

import de.greenrobot.event.EventBus;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.ExperienceKey;

public abstract class BaseKernelService {
  private Context mContext;
  private ExperienceKey mCurrentExperienceKey = null;

  public BaseKernelService(Context context) {
    mContext = context;
    EventBus.getDefault().register(this);
  }

  protected Context getContext() {
    return mContext;
  }

  protected ExperienceKey getCurrentExperienceKey() {
    return mCurrentExperienceKey;
  }

  abstract public void onExperienceForegrounded(ExperienceKey experienceKey);
  abstract public void onExperienceBackgrounded(ExperienceKey experienceKey);

  public void onEvent(BaseExperienceActivity.ExperienceBackgroundedEvent event) {
    mCurrentExperienceKey = null;
    onExperienceBackgrounded(event.getExperienceKey());
  }

  public void onEvent(BaseExperienceActivity.ExperienceForegroundedEvent event) {
    mCurrentExperienceKey = event.getExperienceKey();
    onExperienceForegrounded(event.getExperienceKey());
  }
}
