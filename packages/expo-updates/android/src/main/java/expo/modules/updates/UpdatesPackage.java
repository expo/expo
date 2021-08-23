package expo.modules.updates;

import android.content.Context;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Collections;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.ReactNativeHostHandler;

public class UpdatesPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new UpdatesService(context));
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new UpdatesModule(context));
  }

  @Override
  public List<? extends ReactNativeHostHandler> createReactNativeHostHandlers(Context context) {
    final ReactNativeHostHandler handler = new ReactNativeHostHandler() {
      @Nullable
      @Override
      public ReactInstanceManager createReactInstanceManager(boolean useDeveloperSupport) {
        if (!useDeveloperSupport) {
          UpdatesController.initialize(context);
        }
        return null;
      }

      @Nullable
      @Override
      public String getJSBundleFile(boolean useDeveloperSupport) {
        return useDeveloperSupport
          ? null
          : UpdatesController.getInstance().getLaunchAssetFile();
      }

      @Nullable
      @Override
      public String getBundleAssetName(boolean useDeveloperSupport) {
        return useDeveloperSupport
          ? null
          : UpdatesController.getInstance().getBundleAssetName();
      }

      @Override
      public void onRegisterJSIModules(@NonNull ReactApplicationContext reactApplicationContext,
                                       @NonNull JavaScriptContextHolder jsContext,
                                       boolean useDeveloperSupport) {
      }
    };
    return Collections.singletonList(handler);
  }
}
