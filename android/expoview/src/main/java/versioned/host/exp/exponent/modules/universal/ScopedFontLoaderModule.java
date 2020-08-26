package versioned.host.exp.exponent.modules.universal;

import android.content.Context;

import org.unimodules.core.InvalidArgumentException;
import org.unimodules.core.Promise;
import org.unimodules.core.errors.CodedException;
import org.unimodules.interfaces.constants.ConstantsInterface;
import org.unimodules.interfaces.filesystem.FilePermissionModuleInterface;
import org.unimodules.interfaces.filesystem.Permission;

import expo.modules.font.FontLoaderModule;

public class ScopedFontLoaderModule extends FontLoaderModule {
  private static final String SCOPED_FONT_PREFIX = "Expo-";

  public ScopedFontLoaderModule(Context context) {
    super(context);
  }

  @Override
  public void loadAsync(String providedFontFamilyName, String localUri, Promise promise) {
    String fontFamilyName = providedFontFamilyName;

    if (isScoped()) {
      // Validate font family name before we prefix it
      if (providedFontFamilyName == null) {
        promise.reject(new InvalidArgumentException("Font family name cannot be empty (null received)"));
        return;
      }

      // Scope font family name
      fontFamilyName = SCOPED_FONT_PREFIX + providedFontFamilyName;

      // Ensure filesystem access permissions
      FilePermissionModuleInterface filePermissionModule = mModuleRegistry.getModule(FilePermissionModuleInterface.class);
      if (filePermissionModule != null) {
        if (!filePermissionModule.getPathPermissions(getContext(), localUri).contains(Permission.READ)) {
          promise.reject(new LocationAccessUnauthorizedError(localUri));
          return;
        }
      }
    }

    super.loadAsync(fontFamilyName, localUri, promise);
  }

  private boolean isScoped() {
    ConstantsInterface constantsModule = mModuleRegistry.getModule(ConstantsInterface.class);
    // If there's no constants module, or app ownership isn't "expo", we're not in Expo Client.
    return constantsModule != null && "expo".equals(constantsModule.getAppOwnership());
  }

  public static class LocationAccessUnauthorizedError extends CodedException {
    public LocationAccessUnauthorizedError(String uri) {
      super("You aren't authorized to load font file from: " + uri);
    }

    @Override
    public String getCode() {
      return "ERR_LOCATION_ACCESS_UNAUTHORIZED";
    }
  }
}
