package expo.modules.ads.admob;

import android.content.Context;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;

import java.util.Arrays;
import java.util.Collections;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;

public class AdMobModule extends ExportedModule {

  private static String sTestDeviceID = null;

  @Override
  public String getName() {
    return "ExpoAdsAdMob";
  }

  public AdMobModule(Context context) {
    super(context);
  }

  @ExpoMethod
  public void setTestDeviceIDAsync(String testDeviceID, Promise promise) {
    // TODO: use RequestConfiguration.Builder.setTestDeviceIds() and
    // MobileAds.setRequestConfiguration(configuration) instead of a static field
    // after upgrading to play-services-ads:18.3.0 or later
    if (testDeviceID == null || "".equals(testDeviceID)) {
      sTestDeviceID = null;
    } else if ("EMULATOR".equals(testDeviceID)) {
      sTestDeviceID = AdRequest.DEVICE_ID_EMULATOR;
    } else {
      sTestDeviceID = testDeviceID;
    }

    RequestConfiguration configuration =
        new RequestConfiguration.Builder()
            .setTestDeviceIds(Collections.singletonList(sTestDeviceID))
            .build();
    MobileAds.setRequestConfiguration(configuration);

    promise.resolve(null);
  }
}
