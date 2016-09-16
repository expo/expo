// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import android.app.Application;
import android.content.Context;

import dagger.Module;
import dagger.Provides;

@Module
public class AppModule {

  private final Application mApplication;

  public AppModule(Application application) {
    this.mApplication = application;
  }

  @Provides
  Context provideApplicationContext() {
    return mApplication;
  }

  @Provides
  Application provideApplication() {
    return mApplication;
  }
}
