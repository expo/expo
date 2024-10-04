package host.exp.exponent.generated;

import com.facebook.common.internal.DoNotStrip;

import java.util.ArrayList;
import java.util.List;

import expo.modules.splashscreen.SplashScreenImageResizeMode;
import host.exp.exponent.BuildConfig;
import host.exp.exponent.Constants;

@DoNotStrip
public class AppConstants {

  public static final String VERSION_NAME = null;
  public static final String RELEASE_CHANNEL = "default";
  public static boolean ARE_REMOTE_UPDATES_ENABLED = true;
  public static boolean UPDATES_CHECK_AUTOMATICALLY = true;
  public static int UPDATES_FALLBACK_TO_CACHE_TIMEOUT = 0;
  public static final List<Constants.EmbeddedResponse> EMBEDDED_RESPONSES;
  public static boolean FCM_ENABLED = true;
  public static SplashScreenImageResizeMode SPLASH_SCREEN_IMAGE_RESIZE_MODE = SplashScreenImageResizeMode.CONTAIN;

  static {
    List<Constants.EmbeddedResponse> embeddedResponses = new ArrayList<>();

    // ADD EMBEDDED RESPONSES HERE
    // START EMBEDDED RESPONSES
    // END EMBEDDED RESPONSES
    EMBEDDED_RESPONSES = embeddedResponses;
  }

  // Called from expoview/Constants
  public static Constants.ExpoViewAppConstants get() {
    Constants.ExpoViewAppConstants constants = new Constants.ExpoViewAppConstants();
    constants.VERSION_NAME = VERSION_NAME;
    constants.RELEASE_CHANNEL = RELEASE_CHANNEL;
    constants.ARE_REMOTE_UPDATES_ENABLED = ARE_REMOTE_UPDATES_ENABLED;
    constants.UPDATES_CHECK_AUTOMATICALLY = UPDATES_CHECK_AUTOMATICALLY;
    constants.UPDATES_FALLBACK_TO_CACHE_TIMEOUT = UPDATES_FALLBACK_TO_CACHE_TIMEOUT;
    constants.EMBEDDED_RESPONSES = EMBEDDED_RESPONSES;
    constants.ANDROID_VERSION_CODE = BuildConfig.VERSION_CODE;
    constants.FCM_ENABLED = FCM_ENABLED;
    constants.SPLASH_SCREEN_IMAGE_RESIZE_MODE = SPLASH_SCREEN_IMAGE_RESIZE_MODE;
    return constants;
  }
}
