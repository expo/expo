// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font;

import android.content.Context;
import android.graphics.Typeface;
import android.net.Uri;

import com.facebook.react.views.text.ReactFontManager;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.errors.CodedRuntimeException;
import org.unimodules.core.errors.InvalidArgumentException;
import org.unimodules.core.interfaces.ExpoMethod;

import java.io.File;
import java.util.HashSet;
import java.util.Set;

import expo.modules.font.exceptions.FontAlreadyLoadedException;
import expo.modules.font.exceptions.FontFileInvalidException;
import expo.modules.font.exceptions.FontFileNotFoundException;

public class FontLoaderModule extends ExportedModule {
  private static final String ASSET_SCHEME = "asset://";
  private static final String EXPORTED_NAME = "ExpoFontLoader";

  protected ModuleRegistry mModuleRegistry;
  protected Set<String> mLoadedFontNames;

  public FontLoaderModule(Context context) {
    super(context);
    mLoadedFontNames = new HashSet<>();
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
      if (mLoadedFontNames.contains(fontFamilyName)) {
        throw new FontAlreadyLoadedException(fontFamilyName);
      }

      // Validate arguments
      if (fontFamilyName == null) {
        throw new InvalidArgumentException("Font family name cannot be empty (null received)");
      }
      if (localUri == null) {
        throw new InvalidArgumentException("Local font URI cannot be empty (null received)");
      }

      Typeface typeface = getTypeface(localUri);
      if (typeface == null) {
        throw new FontFileInvalidException(localUri);
      }

      ReactFontManager.getInstance().setTypeface(fontFamilyName, Typeface.NORMAL, typeface);
      mLoadedFontNames.add(fontFamilyName);
      promise.resolve(null);
    } catch (CodedRuntimeException e) {
      // Most probably an InvalidArgumentException. Already coded!
      promise.reject(e);
    } catch (RuntimeException e) {
      // Runtime exception is thrown if and only if there's no font file
      promise.reject(new FontFileNotFoundException(fontFamilyName, localUri));
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
