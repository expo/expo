// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import android.content.Context;

import de.greenrobot.event.EventBus;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.kernel.ExperienceId;

public abstract class BaseKernelService {
  private Context mContext;
  private ExperienceId mCurrentExperienceId = null;

  public BaseKernelService(Context context) {
    mContext = context;
    EventBus.getDefault().register(this);
  }

  protected Context getContext() {
    return mContext;
  }

  protected ExperienceId getCurrentExperienceId() {
    return mCurrentExperienceId;
  }

  abstract public void onExperienceForegrounded(ExperienceId experienceId);
  abstract public void onExperienceBackgrounded(ExperienceId experienceId);

  public void onEvent(BaseExperienceActivity.ExperienceBackgroundedEvent event) {
    mCurrentExperienceId = null;
    onExperienceBackgrounded(event.getExperienceId());
  }

  public void onEvent(BaseExperienceActivity.ExperienceForegroundedEvent event) {
    mCurrentExperienceId = event.getExperienceId();
    onExperienceForegrounded(event.getExperienceId());
  }
}
