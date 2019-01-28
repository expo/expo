package versioned.host.exp.exponent.modules.universal;

import android.content.Context;

import expo.modules.amplitude.AmplitudeModule;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;

public class ScopedAmplitudeModule extends AmplitudeModule {
  public ScopedAmplitudeModule(Context context) {
    super(context);
  }

  @Override
  protected void resetAmplitudeDatabaseHelper() {
    Analytics.resetAmplitudeDatabaseHelper();
  }

  @Override
  protected void log(String tag, String msg) {
    EXL.e(tag, msg);
  }
}
