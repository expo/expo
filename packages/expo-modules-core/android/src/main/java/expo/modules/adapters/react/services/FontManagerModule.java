package expo.modules.adapters.react.services;

import android.graphics.Typeface;

import com.facebook.react.views.text.ReactFontManager;

import java.util.Collections;
import java.util.List;

import expo.modules.core.interfaces.InternalModule;

import expo.modules.interfaces.font.FontManagerInterface;

public class FontManagerModule implements FontManagerInterface, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(FontManagerInterface.class);
  }

  @Override
  public void setTypeface(String fontFamilyName, int style, Typeface typeface) {
    ReactFontManager.getInstance().setTypeface(fontFamilyName, style, typeface);
  }
}
