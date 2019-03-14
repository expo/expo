package org.unimodules.core.interfaces;

public interface LifecycleEventListener {
  void onHostResume();
  void onHostPause();
  void onHostDestroy();
}
