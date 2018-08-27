package expo.modules.ads.admob;

import android.content.Context;
import android.os.Bundle;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;

/*package*/ class AdMobUtils {
  static AdSize getAdSizeFromString(String adSize) {
    switch (adSize) {
      case "banner":
        return AdSize.BANNER;
      case "largeBanner":
        return AdSize.LARGE_BANNER;
      case "mediumRectangle":
        return AdSize.MEDIUM_RECTANGLE;
      case "fullBanner":
        return AdSize.FULL_BANNER;
      case "leaderBoard":
        return AdSize.LEADERBOARD;
      case "smartBannerPortrait":
        return AdSize.SMART_BANNER;
      case "smartBannerLandscape":
        return AdSize.SMART_BANNER;
      case "smartBanner":
        return AdSize.SMART_BANNER;
      default:
        return AdSize.BANNER;
    }
  }

  static String errorStringForAdFailedCode(int errorCode) {
    switch (errorCode) {
      case AdRequest.ERROR_CODE_INTERNAL_ERROR:
        return "ERROR_CODE_INTERNAL_ERROR";
      case AdRequest.ERROR_CODE_INVALID_REQUEST:
        return "ERROR_CODE_INVALID_REQUEST";
      case AdRequest.ERROR_CODE_NETWORK_ERROR:
        return "ERROR_CODE_NETWORK_ERROR";
      case AdRequest.ERROR_CODE_NO_FILL:
        return "ERROR_CODE_NO_FILL";
    }

    return null;
  }

  static Bundle createEventForAdFailedToLoad(int errorCode) {
    Bundle event = new Bundle();
    event.putString("error", errorStringForAdFailedCode(errorCode));
    return event;
  }

  static Bundle createEventForSizeChange(Context context, AdSize adSize) {
    Bundle event = new Bundle();

    int width;
    int height;
    if (adSize == AdSize.SMART_BANNER) {
      width = AdMobUtils.toDIPFromPixel(context, adSize.getWidthInPixels(context));
      height = AdMobUtils.toDIPFromPixel(context, adSize.getHeightInPixels(context));
    } else {
      width = adSize.getWidth();
      height = adSize.getHeight();
    }
    event.putDouble("width", width);
    event.putDouble("height", height);

    return event;
  }

  static int toDIPFromPixel(Context context, int pixels) {
    float displayDensity = context.getResources().getDisplayMetrics().density;
    return (int) (pixels / displayDensity);
  }
}
