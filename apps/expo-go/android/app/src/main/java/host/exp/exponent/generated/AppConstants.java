package host.exp.exponent.generated;

import com.facebook.common.internal.DoNotStrip;

import host.exp.exponent.experience.splashscreen.legacy.SplashScreenImageResizeMode;
import host.exp.exponent.BuildConfig;
import host.exp.exponent.Constants;

@DoNotStrip
public class AppConstants {

  public static final String VERSION_NAME = null;
  public static boolean FCM_ENABLED = true;
  public static SplashScreenImageResizeMode SPLASH_SCREEN_IMAGE_RESIZE_MODE = SplashScreenImageResizeMode.CONTAIN;

  // Called from expoview/Constants
  public static Constants.ExpoViewAppConstants get() {
    Constants.ExpoViewAppConstants constants = new Constants.ExpoViewAppConstants();
    constants.VERSION_NAME = VERSION_NAME;
    constants.ANDROID_VERSION_CODE = BuildConfig.VERSION_CODE;
    constants.FCM_ENABLED = FCM_ENABLED;
    constants.SPLASH_SCREEN_IMAGE_RESIZE_MODE = SPLASH_SCREEN_IMAGE_RESIZE_MODE;
    return constants;
  }
}
