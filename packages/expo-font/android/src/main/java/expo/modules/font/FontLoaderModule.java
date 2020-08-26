// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font;

import android.content.Context;
import android.graphics.Typeface;
import android.net.Uri;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.FontManager;

import java.io.File;
import java.util.Objects;

public class FontLoaderModule extends ExportedModule {
  private static final String ASSET_SCHEME = "asset://";
  private static final String EXPORTED_NAME = "ExpoFontLoader";

  private ModuleRegistry mModuleRegistry;

  public FontLoaderModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @ExpoMethod
  public void loadAsync(final String fontFamilyName, final String localUri, final Promise promise) {
    try {
      Typeface typeface;

      if (localUri.startsWith(ASSET_SCHEME)) {
        typeface = Typeface.createFromAsset(
          getContext().getAssets(),
          // Also remove the leading slash.
          localUri.substring(ASSET_SCHEME.length() + 1));
      } else {
        typeface = Typeface.createFromFile(new File(Objects.requireNonNull(Uri.parse(localUri).getPath())));
      }

      FontManager fontManager = mModuleRegistry.getModule(FontManager.class);
      if (fontManager == null) {
        promise.reject("E_NO_FONT_MANAGER", "There is no FontManager in module registry. Are you sure all the dependencies of expo-font are installed and linked?");
        return;
      }
      fontManager.setTypeface(fontFamilyName, Typeface.NORMAL, typeface);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("E_UNEXPECTED", "Font.loadAsync unexpected exception: " + e.getMessage(), e);
    }
  }
}
