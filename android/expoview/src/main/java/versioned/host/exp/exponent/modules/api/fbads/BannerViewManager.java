package versioned.host.exp.exponent.modules.api.fbads;


import android.support.annotation.Nullable;

import com.facebook.ads.AdSize;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class BannerViewManager extends SimpleViewManager<BannerView> {
  @ReactProp(name = "placementId")
  public void setPlacementId(BannerView view, String placementId) {
    view.setPlacementId(placementId);
  }

  @ReactProp(name = "size")
  public void setSize(BannerView view, int size) {
    AdSize adSize = null;
    switch (size) {
      case 90:
        adSize = AdSize.BANNER_HEIGHT_90;
        break;
      case 250:
        adSize = AdSize.RECTANGLE_HEIGHT_250;
      case 50:
      default:
        adSize = AdSize.BANNER_HEIGHT_50;
    }
    view.setSize(adSize);
  }

  @Override
  protected BannerView createViewInstance(ThemedReactContext reactContext) {
    return new BannerView(reactContext);
  }

  @Override
  public @Nullable Map getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.of(
      "onAdPress",
      MapBuilder.of("registrationName", "onAdPress"),
      "onAdError",
      MapBuilder.of("registrationName", "onAdError"),
      "onLoggingImpression",
      MapBuilder.of("registrationName", "onLoggingImpression")
    );
  }

  @Override
  public String getName() {
    return "CTKBannerView";
  }
}
