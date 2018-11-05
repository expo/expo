package expo.core.interfaces;

public interface LifecycleEventListener {
  void onHostResume();
  void onHostPause();
  void onHostDestroy();
}
