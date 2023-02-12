package abi47_0_0.expo.modules.adapters.react;

import android.content.Context;

import abi47_0_0.com.facebook.react.bridge.ReactContext;

import abi47_0_0.expo.modules.adapters.react.permissions.PermissionsService;
import abi47_0_0.expo.modules.adapters.react.services.CookieManagerModule;
import abi47_0_0.expo.modules.adapters.react.services.EventEmitterModule;
import abi47_0_0.expo.modules.adapters.react.services.FontManagerModule;
import abi47_0_0.expo.modules.adapters.react.services.RuntimeEnvironmentModule;
import abi47_0_0.expo.modules.adapters.react.services.UIManagerModuleWrapper;
import abi47_0_0.expo.modules.core.BasePackage;
import abi47_0_0.expo.modules.core.interfaces.InternalModule;
import abi47_0_0.expo.modules.core.interfaces.Package;

import java.util.Arrays;
import java.util.List;

/**
 * A {@link Package} creating modules provided with the @unimodules/react-native-adapter package.
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
        new FontManagerModule(),
        new RuntimeEnvironmentModule(),
        new PermissionsService(reactContext)
    );
  }
}
