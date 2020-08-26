package versioned.host.exp.exponent.modules.universal;

import android.content.Context;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.interfaces.constants.ConstantsInterface;

import expo.modules.font.FontLoaderModule;

public class ScopedFontLoaderModule extends FontLoaderModule {
  private ModuleRegistry mModuleRegistry;

  public ScopedFontLoaderModule(Context context) {
    super(context);
  }

  @Override
  public void loadAsync(String providedFontFamilyName, String localUri, Promise promise) {
    String fontFamilyName = providedFontFamilyName;
    if (isScoped()) {
      fontFamilyName = "Expo-" + providedFontFamilyName;

      // TODO(nikki): make sure path is in experience's scope
    }
    super.loadAsync(fontFamilyName, localUri, promise);
  }


  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  private boolean isScoped() {
    ConstantsInterface constantsModule = mModuleRegistry.getModule(ConstantsInterface.class);
    // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
    return constantsModule != null && "expo".equals(constantsModule.getAppOwnership());
  }
}
