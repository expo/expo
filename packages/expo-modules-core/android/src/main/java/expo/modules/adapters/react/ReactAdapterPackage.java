package expo.modules.adapters.react;

import android.content.Context;

import com.facebook.react.bridge.ReactContext;

import expo.modules.adapters.react.permissions.PermissionsService;
import expo.modules.adapters.react.services.CookieManagerModule;
import expo.modules.adapters.react.services.EventEmitterModule;
import expo.modules.adapters.react.services.FontManagerModule;
import expo.modules.adapters.react.services.RuntimeEnvironmentModule;
import expo.modules.adapters.react.services.UIManagerModuleWrapper;
import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.Package;

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
