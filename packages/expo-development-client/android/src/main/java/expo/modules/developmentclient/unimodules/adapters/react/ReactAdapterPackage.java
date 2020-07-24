package expo.modules.developmentclient.unimodules.adapters.react;

import android.content.Context;

import com.facebook.react.bridge.ReactContext;

import java.util.Arrays;
import java.util.List;

//import expo.modules.developmentclient.unimodules.adapters.react.apploader.RNHeadlessAppLoader;
import expo.modules.developmentclient.unimodules.adapters.react.services.CookieManagerModule;
import expo.modules.developmentclient.unimodules.adapters.react.services.EventEmitterModule;
import expo.modules.developmentclient.unimodules.adapters.react.services.FontManagerModule;
import expo.modules.developmentclient.unimodules.adapters.react.services.RuntimeEnvironmentModule;
import expo.modules.developmentclient.unimodules.adapters.react.services.UIManagerModuleWrapper;
import expo.modules.developmentclient.unimodules.core.BasePackage;
import expo.modules.developmentclient.unimodules.core.interfaces.InternalModule;
import expo.modules.developmentclient.unimodules.core.interfaces.Package;

//import expo.modules.developmentclient.unimodules.apploader.AppLoaderProvider;

/**
 * A {@link Package} creating modules provided with the @unimodules/react-native-adapter package.
 */
public class ReactAdapterPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
//    AppLoaderProvider.registerLoader(context, "react-native-headless", RNHeadlessAppLoader.class);
    // We can force-cast here, because this package will only be used in React Native context.
    ReactContext reactContext = (ReactContext) context;
    return Arrays.asList(
        new CookieManagerModule(reactContext),
        new UIManagerModuleWrapper(reactContext),
        new EventEmitterModule(reactContext),
        new FontManagerModule(),
        new RuntimeEnvironmentModule()
    );
  }
}
