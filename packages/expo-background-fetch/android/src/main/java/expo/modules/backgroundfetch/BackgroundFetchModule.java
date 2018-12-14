package expo.modules.backgroundfetch;

import android.content.Context;

import expo.core.ExportedModule;

class BackgroundFetchModule extends ExportedModule {
  public BackgroundFetchModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoBackgroundFetch";
  }
}
