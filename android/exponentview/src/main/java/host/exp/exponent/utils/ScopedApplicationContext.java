// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.app.Application;
import android.content.ComponentCallbacks;
import android.content.res.Configuration;

public class ScopedApplicationContext extends Application {

  private Application mApplication;

  public ScopedApplicationContext(final Application application, final ScopedContext context) {
    mApplication = application;

    attachBaseContext(context);
  }

  @Override
  public void onCreate() {
    mApplication.onCreate();
  }

  @Override
  public void onTerminate() {
    mApplication.onTerminate();
  }

  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    mApplication.onConfigurationChanged(newConfig);
  }

  @Override
  public void onLowMemory() {
    mApplication.onLowMemory();
  }

  @Override
  public void onTrimMemory(int level) {
    mApplication.onTrimMemory(level);
  }

  @Override
  public void registerComponentCallbacks(ComponentCallbacks callback) {
    mApplication.registerComponentCallbacks(callback);
  }

  @Override
  public void unregisterComponentCallbacks(ComponentCallbacks callback) {
    mApplication.unregisterComponentCallbacks(callback);
  }

  @Override
  public void registerActivityLifecycleCallbacks(ActivityLifecycleCallbacks callback) {
    mApplication.registerActivityLifecycleCallbacks(callback);
  }

  @Override
  public void unregisterActivityLifecycleCallbacks(ActivityLifecycleCallbacks callback) {
    mApplication.unregisterActivityLifecycleCallbacks(callback);
  }

  @Override
  public void registerOnProvideAssistDataListener(OnProvideAssistDataListener callback) {
    mApplication.registerOnProvideAssistDataListener(callback);
  }

  @Override
  public void unregisterOnProvideAssistDataListener(OnProvideAssistDataListener callback) {
    mApplication.unregisterOnProvideAssistDataListener(callback);
  }
}
