package abi44_0_0.expo.modules.webbrowser;

import android.net.Uri;

import abi44_0_0.expo.modules.core.interfaces.InternalModule;

public interface CustomTabsConnectionHelper extends InternalModule {
  void warmUp(String packageName);

  void mayInitWithUrl(String packageName, Uri uri);

  boolean coolDown(String packageName);
}
