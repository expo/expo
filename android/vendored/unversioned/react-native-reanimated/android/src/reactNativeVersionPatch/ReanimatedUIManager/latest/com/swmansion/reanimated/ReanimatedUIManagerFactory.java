package com.swmansion.reanimated;

import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ReanimatedUIImplementation;
import com.facebook.react.uimanager.ReanimatedUIManager;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.List;

public class ReanimatedUIManagerFactory {

  static UIManagerModule create(ReactApplicationContext reactContext, List<ViewManager> viewManagers, int minTimeLeftInFrameForNonBatchedOperationMs) {
    ViewManagerRegistry viewManagerRegistry = new ViewManagerRegistry(viewManagers);

    UIManagerModule uiManagerModule =
        new ReanimatedUIManager(
            reactContext, viewManagers, minTimeLeftInFrameForNonBatchedOperationMs);

    UIImplementation uiImplementation =
        new ReanimatedUIImplementation(
            reactContext,
            viewManagerRegistry,
            uiManagerModule.getEventDispatcher(),
            minTimeLeftInFrameForNonBatchedOperationMs);

    Class clazz = uiManagerModule.getClass().getSuperclass();
    if (clazz == null) {
      Log.e("reanimated", "unable to resolve super class of ReanimatedUIManager");
      return uiManagerModule;
    }

    try {
      Field uiImplementationField = clazz.getDeclaredField("mUIImplementation");
      uiImplementationField.setAccessible(true);

      if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        try {
          // accessFlags is supported only by API >=23
          Field modifiersField = Field.class.getDeclaredField("accessFlags");
          modifiersField.setAccessible(true);
          modifiersField.setInt(
              uiImplementationField, uiImplementationField.getModifiers() & ~Modifier.FINAL);
        } catch (NoSuchFieldException | IllegalAccessException e) {
          e.printStackTrace();
        }
      }
      uiImplementationField.set(uiManagerModule, uiImplementation);
    } catch (NoSuchFieldException | IllegalAccessException e) {
      e.printStackTrace();
    }

    return uiManagerModule;
  }

}