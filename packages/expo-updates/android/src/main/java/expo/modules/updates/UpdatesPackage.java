package expo.modules.updates;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.Collections;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.UiThread;
import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.ReactNativeHostHandler;

// these unused imports must stay because of versioning
import expo.modules.updates.UpdatesController;

public class UpdatesPackage extends BasePackage {
  private static final String TAG = UpdatesPackage.class.getSimpleName();

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
      private Boolean mShouldAutoSetup = null;

      @Nullable
      @Override
      public ReactInstanceManager createReactInstanceManager(boolean useDeveloperSupport) {
        if (shouldAutoSetup(context) && !useDeveloperSupport) {
          UpdatesController.initialize(context);
        }
        return null;
      }

      @Nullable
      @Override
      public String getJSBundleFile(boolean useDeveloperSupport) {
        return shouldAutoSetup(context) && !useDeveloperSupport
          ? UpdatesController.getInstance().getLaunchAssetFile()
          : null;
      }

      @Nullable
      @Override
      public String getBundleAssetName(boolean useDeveloperSupport) {
        return shouldAutoSetup(context) && !useDeveloperSupport
          ? UpdatesController.getInstance().getBundleAssetName()
          : null;
      }

      @Override
      public void onRegisterJSIModules(@NonNull ReactApplicationContext reactApplicationContext,
                                       @NonNull JavaScriptContextHolder jsContext,
                                       boolean useDeveloperSupport) {
      }

      @UiThread
      private boolean shouldAutoSetup(final Context context) {
        if (mShouldAutoSetup == null) {
          try {
            final PackageManager pm = context.getPackageManager();
            final ApplicationInfo ai = pm.getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA);
            mShouldAutoSetup = ai.metaData.getBoolean("expo.modules.updates.AUTO_SETUP", true);
          } catch (Exception e) {
            Log.e(TAG, "Could not read expo-updates configuration data in AndroidManifest", e);
            mShouldAutoSetup = true;
          }
        }
        return mShouldAutoSetup;
      }
    };

    return Collections.singletonList(handler);
  }
}
