package abi47_0_0.host.exp.exponent.modules.api.components.sharedelement;

import androidx.annotation.NonNull;

import abi47_0_0.com.facebook.react.bridge.Promise;
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi47_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi47_0_0.com.facebook.react.bridge.ReactMethod;
import abi47_0_0.com.facebook.react.bridge.ReadableMap;
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi47_0_0.com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNSharedElementModule.MODULE_NAME)
public class RNSharedElementModule extends ReactContextBaseJavaModule {
  public static final String MODULE_NAME = "RNSharedElementTransition";
  // private final static String LOG_TAG = "RNSharedElementModule";

  private final RNSharedElementNodeManager mNodeManager;

  public RNSharedElementModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mNodeManager = new RNSharedElementNodeManager(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return MODULE_NAME;
  }

  RNSharedElementNodeManager getNodeManager() {
    return mNodeManager;
  }

  @ReactMethod
  public void configure(final ReadableMap config, final Promise promise) {

    // Store a reference to the native view manager in the node-manager.
    // This is done so that we can efficiently resolve a view when the
    // start- and end props are set on the Transition view.
    final ReactApplicationContext context = getReactApplicationContext();
    final UIManagerModule uiManager = context.getNativeModule(UIManagerModule.class);
    uiManager.prependUIBlock(mNodeManager::setNativeViewHierarchyManager);

    promise.resolve(true);
  }
}