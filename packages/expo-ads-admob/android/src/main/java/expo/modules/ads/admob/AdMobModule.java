package expo.modules.ads.admob;

import android.content.Context;

import com.google.android.gms.ads.AdRequest;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

public class AdMobModule extends ExportedModule {

  private static String sTestDeviceID = null;

  @Override
  public String getName() {
    return "ExpoAdsAdMob";
  }

  public AdMobModule(Context context) {
    super(context);
  }

  public static String getTestDeviceID() {
    return sTestDeviceID;
  }

  @ExpoMethod
  public void setTestDeviceIDAsync(String testDeviceID, Promise promise) {
    if (testDeviceID == null || "".equals(testDeviceID)) {
      sTestDeviceID = null;
    } else if ("EMULATOR".equals(testDeviceID)) {
      sTestDeviceID = AdRequest.DEVICE_ID_EMULATOR;
    } else {
      sTestDeviceID = testDeviceID;
    }
    promise.resolve(null);
  }
}
