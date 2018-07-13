package host.exp.exponent.kernel.services;

import android.content.Context;

import de.greenrobot.event.EventBus;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.kernel.ExperienceId;

public class SplashScreenKernelService extends BaseKernelService {

  private boolean mAutoHide = true;
  private boolean mAppLoadingStarted = false;
  private boolean mAppLoadingFinished = false;

  public SplashScreenKernelService(Context context) {
    super(context);
  }

  public void onExperienceContentsLoaded(ExperienceId experienceId) {
    mAppLoadingFinished = true;
    mAppLoadingStarted = false;
    EventBus.getDefault().post(new BaseExperienceActivity.ExperienceContentLoaded(experienceId));
  }

  @Override
  public void onExperienceForegrounded(ExperienceId experienceId) {

  }

  @Override
  public void onExperienceBackgrounded(ExperienceId experienceId) {

  }

  public boolean shouldAutoHide() {
    return mAutoHide;
  }

  public boolean isAppLoadingStarted() {
    return mAppLoadingStarted;
  }

  public boolean isAppLoadingFinished() {
    return mAppLoadingFinished;
  }

  public void preventAutoHide() {
    mAppLoadingStarted = true;
    mAutoHide = false;
  }

  public void reset() {
    mAutoHide = true;
    mAppLoadingStarted = false;
    mAppLoadingFinished = false;
  }
}
