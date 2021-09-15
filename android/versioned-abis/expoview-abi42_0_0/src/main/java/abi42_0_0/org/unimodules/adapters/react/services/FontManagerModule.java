package abi42_0_0.org.unimodules.adapters.react.services;

import android.graphics.Typeface;

import abi42_0_0.com.facebook.react.views.text.ReactFontManager;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.interfaces.InternalModule;

import abi42_0_0.expo.modules.interfaces.font.FontManagerInterface;

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
