package abi31_0_0.expo.adapters.react.services;

import android.graphics.Typeface;

import abi31_0_0.com.facebook.react.views.text.ReactFontManager;

import java.util.Collections;
import java.util.List;

import abi31_0_0.expo.core.interfaces.InternalModule;
import abi31_0_0.expo.interfaces.font.FontManager;

public class FontManagerModule implements FontManager, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(FontManager.class);
  }

  @Override
  public void setTypeface(String fontFamilyName, int style, Typeface typeface) {
    ReactFontManager.getInstance().setTypeface(fontFamilyName, style, typeface);
  }
}
