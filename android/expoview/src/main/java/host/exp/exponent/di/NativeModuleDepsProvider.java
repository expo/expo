// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import android.app.Application;
import android.content.Context;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class NativeModuleDepsProvider {

  private static final String TAG = NativeModuleDepsProvider.class.getSimpleName();

  @Inject
  Context mContext;

  @Inject
  Application mApplicationContext;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  @Inject
  Crypto mCrypto;

  @Inject
  ExponentManifest mExponentManifest;

  private Map<Class, Object> mClassesToInjectedObjects = new HashMap<>();

  public NativeModuleDepsProvider(Application application) {
    mContext = application;
    mApplicationContext = application;
    mExponentSharedPreferences = new ExponentSharedPreferences(mContext);
    mExponentNetwork = new ExponentNetwork(mContext, mExponentSharedPreferences);
    mCrypto = new Crypto(mExponentNetwork);
    mExponentManifest = new ExponentManifest(mContext, mExponentNetwork, mCrypto, mExponentSharedPreferences);

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

  private static NativeModuleDepsProvider sInstance = null;

  public static void initialize(Application application) {
    sInstance = new NativeModuleDepsProvider(application);
  }

  public static NativeModuleDepsProvider getInstance() {
    return sInstance;
  }

  public void add(final Class clazz, final Object object) {
    mClassesToInjectedObjects.put(clazz, object);
  }

  public void inject(Class clazz, Object object) {
    for (Field field : clazz.getDeclaredFields()) {
      injectField(object, field);
    }
  }

  private void injectField(Object object, Field field) {
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
