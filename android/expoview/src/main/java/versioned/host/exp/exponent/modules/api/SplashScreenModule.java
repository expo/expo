package versioned.host.exp.exponent.modules.api;

import com.facebook.react.bridge.ReactApplicationContext;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.SplashScreenKernelService;
import versioned.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;
import com.facebook.react.bridge.ReactMethod;

public class SplashScreenModule extends ExpoKernelServiceConsumerBaseModule {

  private SplashScreenKernelService mSplashScreenKernelService;

  public SplashScreenModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
    mSplashScreenKernelService = mKernelServiceRegistry.getSplashScreenKernelService();
  }

  @Override
  public String getName() {
    return "ExponentSplashScreen";
  }

  @ReactMethod
  public void preventAutoHide() {
    mSplashScreenKernelService.preventAutoHide();
  }

  @ReactMethod
  public void hide() {
    mSplashScreenKernelService.onExperienceContentsLoaded(this.experienceId);
  }
}
