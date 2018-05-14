package expo.adapters.react;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.List;

import expo.core.ModuleRegistry;

/**
 * Interface for {@link com.facebook.react.ReactPackage},
 * so we can create view managers and native modules
 * with a reference to the {@link ModuleRegistry}.
 */
public interface ReactPackage {
  List<ViewManager> createViewManagers(ReactApplicationContext reactContext);
}
