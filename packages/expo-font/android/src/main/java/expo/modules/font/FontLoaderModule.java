// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font;

import android.content.Context;
import android.graphics.Typeface;
import android.net.Uri;

import com.facebook.react.views.text.ReactFontManager;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.InvalidArgumentException;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;

import java.io.File;

public class FontLoaderModule extends ExportedModule {
  private static final String ASSET_SCHEME = "asset://";
  private static final String EXPORTED_NAME = "ExpoFontLoader";

  protected ModuleRegistry mModuleRegistry;

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
    // Validate arguments
    if (fontFamilyName == null) {
      promise.reject(new InvalidArgumentException("Font family name cannot be empty (null received)"));
      return;
    }

    if (localUri == null) {
      promise.reject(new InvalidArgumentException("Local font URI cannot be empty (null received)"));
      return;
    }

    try {
      ReactFontManager.getInstance().setTypeface(fontFamilyName, Typeface.NORMAL, getTypeface(localUri));
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  protected Typeface getTypeface(String localUri) throws InvalidArgumentException {
    if (localUri.startsWith(ASSET_SCHEME)) {
      return Typeface.createFromAsset(
        getContext().getAssets(),
        // Also remove the leading slash.
        localUri.substring(ASSET_SCHEME.length() + 1));
    }

    String localFontPath = Uri.parse(localUri).getPath();
    if (localFontPath == null) {
      throw new InvalidArgumentException("Could not parse provided local font URI as a URI with a path component.");
    }
    return Typeface.createFromFile(new File(localFontPath));
  }
}
