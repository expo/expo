package host.exp.exponent.kernel.services;

import android.app.Activity;
import android.content.Context;

import expo.modules.splashscreen.SplashScreen;
import host.exp.exponent.kernel.ExperienceId;

/**
 * Remove once SDK38 is phased out.
 */
public class SplashScreenKernelService extends BaseKernelService {

  public SplashScreenKernelService(Context context) {
    super(context);
  }

  public void hide(Activity activity) {
    SplashScreen.hide(activity);
  }

  public void preventAutoHide(Activity activity) {
    SplashScreen.preventAutoHide(activity);
  }

  @Override
  public void onExperienceForegrounded(ExperienceId experienceId) {}

  @Override
  public void onExperienceBackgrounded(ExperienceId experienceId) {}
}
