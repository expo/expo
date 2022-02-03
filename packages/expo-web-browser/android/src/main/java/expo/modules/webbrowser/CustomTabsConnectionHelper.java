package expo.modules.webbrowser;

import android.net.Uri;

import expo.modules.core.interfaces.InternalModule;

public interface CustomTabsConnectionHelper extends InternalModule {
  void warmUp(String packageName);

  void mayInitWithUrl(String packageName, Uri uri);

  boolean coolDown(String packageName);
}
