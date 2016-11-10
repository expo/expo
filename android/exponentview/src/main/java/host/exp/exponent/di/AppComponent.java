// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import javax.inject.Singleton;

import dagger.Component;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.ExponentViewKernel;
import host.exp.exponentview.Exponent;

@Singleton
@Component(
    modules = {
        AppModule.class
    }
)
public interface AppComponent {
  void inject(Exponent exponent);

  ExponentManifest getExponentManifest();

  void inject(NativeModuleDepsProvider nativeModuleDepsProvider);

  void inject(ExponentViewKernel exponentViewKernel);
}
