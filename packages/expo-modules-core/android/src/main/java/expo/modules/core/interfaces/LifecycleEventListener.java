package expo.modules.core.interfaces;

public interface LifecycleEventListener {
  void onHostResume();
  void onHostPause();
  void onHostDestroy();
}
