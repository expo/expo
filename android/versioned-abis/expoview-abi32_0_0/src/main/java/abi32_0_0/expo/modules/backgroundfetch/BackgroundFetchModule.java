package abi32_0_0.expo.modules.backgroundfetch;

import android.content.Context;

import abi32_0_0.expo.core.ExportedModule;

class BackgroundFetchModule extends ExportedModule {
  public BackgroundFetchModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoBackgroundFetch";
  }
}
