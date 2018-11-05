package abi31_0_0.expo.adapters.react;

import android.content.Context;

import abi31_0_0.com.facebook.react.bridge.ReactContext;

import java.util.Arrays;
import java.util.List;

import abi31_0_0.expo.adapters.react.services.CookieManagerModule;
import abi31_0_0.expo.adapters.react.services.EventEmitterModule;
import abi31_0_0.expo.adapters.react.services.FontManagerModule;
import abi31_0_0.expo.adapters.react.services.UIManagerModuleWrapper;
import abi31_0_0.expo.core.BasePackage;
import abi31_0_0.expo.core.interfaces.InternalModule;
import abi31_0_0.expo.core.interfaces.Package;

/**
 * A {@link Package} creating modules provided with the expo-react-native-adapter package.
 */
public class ReactAdapterPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    // We can force-cast here, because this package will only be used in React Native context.
    ReactContext reactContext = (ReactContext) context;
    return Arrays.asList(
        new CookieManagerModule(reactContext),
        new UIManagerModuleWrapper(reactContext),
        new EventEmitterModule(reactContext),
        new FontManagerModule()
    );
  }
}
