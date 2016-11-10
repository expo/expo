// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponentview.Exponent;

public class NativeModuleDepsProvider {

  private static final String TAG = NativeModuleDepsProvider.class.getSimpleName();

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  @Inject
  ExponentManifest mExponentManifest;


  private Map<Class, Object> mClassesToInjectedObjects = new HashMap<>();

  private static NativeModuleDepsProvider sInstance = null;
  public static NativeModuleDepsProvider getInstance() {
    if (sInstance == null) {
      sInstance = new NativeModuleDepsProvider();
    }

    return sInstance;
  }

  public NativeModuleDepsProvider() {
    Exponent.di().inject(this);

    for (Field field : NativeModuleDepsProvider.class.getDeclaredFields()) {
      if (field.isAnnotationPresent(Inject.class)) {
        try {
          mClassesToInjectedObjects.put(field.getType(), field.get(this));
        } catch (IllegalAccessException e) {
          EXL.e(TAG, e.toString());
        }
      }
    }
  }

  public void inject(Object object) {
    Class clazz = object.getClass();
    for (Field field : clazz.getDeclaredFields()) {
      if (field.isAnnotationPresent(Inject.class)) {
        Class fieldClazz = field.getType();
        if (!mClassesToInjectedObjects.containsKey(fieldClazz)) {
          throw new RuntimeException("NativeModuleDepsProvider could not find object for class " + fieldClazz.toString());
        }

        Object fieldObject = mClassesToInjectedObjects.get(fieldClazz);
        try {
          field.setAccessible(true);
          field.set(object, fieldObject);
        } catch (IllegalAccessException e) {
          EXL.e(TAG, e.toString());
        }
      }
    }
  }
}
