package abi34_0_0.host.exp.exponent.modules.api;

import abi34_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi34_0_0.com.facebook.react.bridge.ReactMethod;
import abi34_0_0.host.exp.exponent.modules.ExpoKernelServiceConsumerBaseModule;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.SplashScreenKernelService;

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
    mSplashScreenKernelService.preventAutoHide(getCurrentActivity());
  }

  @ReactMethod
  public void hide() {
    mSplashScreenKernelService.hide(getCurrentActivity());
  }
}
