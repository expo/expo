package abi42_0_0.host.exp.exponent.modules.universal;

import android.content.Intent;

import abi42_0_0.com.facebook.react.bridge.ReactContext;

import abi42_0_0.org.unimodules.adapters.react.services.UIManagerModuleWrapper;
import abi42_0_0.org.unimodules.core.interfaces.ActivityEventListener;

import java.util.concurrent.CopyOnWriteArraySet;

import host.exp.exponent.ActivityResultListener;
import host.exp.expoview.Exponent;

public class ScopedUIManagerModuleWrapper extends UIManagerModuleWrapper implements ActivityResultListener {
  // We use `CopyOnWriteArraySet` to make this container thread-safe,
  // cause `onActivityResult` can be trigger on a different thread during the listener unregistering.
  private CopyOnWriteArraySet<ActivityEventListener> mActivityEventListeners = new CopyOnWriteArraySet<>();

  public ScopedUIManagerModuleWrapper(ReactContext reactContext) {
    super(reactContext);
  }

  @Override
  public void registerActivityEventListener(final ActivityEventListener activityEventListener) {
    if (mActivityEventListeners.isEmpty()) {
      Exponent.getInstance().addActivityResultListener(this);
    }
    mActivityEventListeners.add(activityEventListener);
  }

  @Override
  public void unregisterActivityEventListener(ActivityEventListener activityEventListener) {
    mActivityEventListeners.remove(activityEventListener);
    if (mActivityEventListeners.isEmpty()) {
      Exponent.getInstance().removeActivityResultListener(this);
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    for (ActivityEventListener listener : mActivityEventListeners) {
      listener.onActivityResult(Exponent.getInstance().getCurrentActivity(), requestCode, resultCode, data);
    }
  }
}
