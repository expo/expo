# The launch screen prerender reaches React Native internals through reflection.
-keep class com.facebook.react.fabric.FabricUIManager {
  private ** mMountingManager;
}
-keep class com.facebook.react.fabric.mounting.MountingManager {
  public ** startSurface(int, com.facebook.react.uimanager.ThemedReactContext, android.view.View);
  public void stopSurface(int);
}
