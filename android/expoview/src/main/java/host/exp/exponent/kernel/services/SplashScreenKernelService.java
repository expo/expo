package host.exp.exponent.kernel.services;

import android.app.Activity;
import android.content.Context;

import expo.modules.splashscreen.SplashScreen;
import host.exp.exponent.kernel.ExperienceId;

public class SplashScreenKernelService extends BaseKernelService {
  SplashScreenKernelService(Context context) {
    super(context);
  }

  @Override
  public void onExperienceForegrounded(ExperienceId experienceId) {}

  @Override
  public void onExperienceBackgrounded(ExperienceId experienceId) {}

  public void preventAutoHide(Activity activity) {
    SplashScreen.preventAutoHide(activity);
  }

  public void hide(Activity activity) {
    SplashScreen.hide(activity);
  }
}
