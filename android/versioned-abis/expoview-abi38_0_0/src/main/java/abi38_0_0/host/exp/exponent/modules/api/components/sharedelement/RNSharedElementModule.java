package abi38_0_0.host.exp.exponent.modules.api.components.sharedelement;

import abi38_0_0.com.facebook.react.bridge.Promise;
import abi38_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi38_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi38_0_0.com.facebook.react.bridge.ReactMethod;
import abi38_0_0.com.facebook.react.bridge.ReadableMap;
import abi38_0_0.com.facebook.react.uimanager.UIBlock;
import abi38_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi38_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;
import abi38_0_0.com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = RNSharedElementModule.MODULE_NAME)
public class RNSharedElementModule extends ReactContextBaseJavaModule {
  public static final String MODULE_NAME = "RNSharedElementTransition";
  static String LOG_TAG = "RNSharedElementModule";

  private RNSharedElementNodeManager mNodeManager;

  public RNSharedElementModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mNodeManager = new RNSharedElementNodeManager(reactContext);
  }

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
    uiManager.prependUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        mNodeManager.setNativeViewHierarchyManager(nativeViewHierarchyManager);
      }
    });
  }
}
