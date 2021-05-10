package org.unimodules.adapters.react.services;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.network.ForwardingCookieHandler;

import java.net.CookieHandler;
import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

public class CookieManagerModule extends ForwardingCookieHandler implements InternalModule, NativeModule {
  private static final String TAG = "CookieManagerModule";

  public CookieManagerModule(ReactContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return null;
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) CookieHandler.class);
  }

  @Override
  public boolean canOverrideExistingModule() {
    return false;
  }

  // `invalidate` replaces `onCatalystInstanceDestroy` in recent RN versions. We can't use
  // @Override here since older versions won't have this method. If one of these methods is
  // needed make sure to add the code to both as only one of the methods will be called depending
  // on the RN version.
  // See https://github.com/facebook/react-native/commit/18c8417290823e67e211bde241ae9dde27b72f17
  public void invalidate() {
    // do nothing
  }

  @Override
  public void onCatalystInstanceDestroy() {
    // do nothing
  }
}
