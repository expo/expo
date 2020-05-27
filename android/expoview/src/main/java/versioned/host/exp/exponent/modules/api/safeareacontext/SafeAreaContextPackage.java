package versioned.host.exp.exponent.modules.api.safeareacontext;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import javax.annotation.Nonnull;

public class SafeAreaContextPackage implements ReactPackage {

  @Nonnull
  @Override
  public List<NativeModule> createNativeModules(@Nonnull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Nonnull
  @Override
  public List<ViewManager> createViewManagers(@Nonnull ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
            new SafeAreaProviderManager(reactContext),
            new SafeAreaViewManager()
    );
  }

}
