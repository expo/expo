package expo.modules.branch;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import javax.annotation.Nonnull;

import io.branch.rnbranch.RNBranchPackage;

public class BranchPackage extends BasePackage implements ReactPackage {
  private RNBranchPackage mPackage = new RNBranchPackage();

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.<InternalModule>singletonList(new BranchIntentNotifier());
  }

  @Nonnull
  @Override
  public List<NativeModule> createNativeModules(@Nonnull ReactApplicationContext reactContext) {
    return mPackage.createNativeModules(reactContext);
  }

  @Nonnull
  @Override
  public List<ViewManager> createViewManagers(@Nonnull ReactApplicationContext reactContext) {
    return mPackage.createViewManagers(reactContext);
  }
}
