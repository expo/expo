package abi39_0_0.org.unimodules.adapters.react.services;

import android.graphics.Typeface;

import abi39_0_0.com.facebook.react.views.text.ReactFontManager;

import java.util.Collections;
import java.util.List;

import abi39_0_0.org.unimodules.core.interfaces.InternalModule;
import abi39_0_0.org.unimodules.interfaces.font.FontManager;

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
