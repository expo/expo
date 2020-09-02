package abi39_0_0.expo.modules.webbrowser;

import android.net.Uri;

import abi39_0_0.org.unimodules.core.interfaces.InternalModule;

public interface CustomTabsConnectionHelper extends InternalModule {
  void warmUp(String packageName);

  void mayInitWithUrl(String packageName, Uri uri);

  boolean coolDown(String packageName);
}
