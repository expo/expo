// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import javax.inject.Singleton;

import dagger.Component;
import host.exp.exponent.ExponentDevActivity;
import host.exp.exponent.ExponentIntentService;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.LauncherActivity;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.experience.ErrorActivity;
import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponent.experience.InfoActivity;
import host.exp.exponent.gcm.ExponentGcmListenerService;
import host.exp.exponent.gcm.RegistrationIntentService;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.modules.ExponentKernelModule;
import host.exp.exponentview.Exponent;
import versioned.host.exp.exponent.modules.api.URLHandlerModule;
import versioned.host.exp.exponent.modules.api.ConstantsModule;
import versioned.host.exp.exponent.modules.api.NotificationsModule;
import versioned.host.exp.exponent.modules.api.UtilModule;
import versioned.host.exp.exponent.modules.internal.ExponentIntentModule;

@Singleton
@Component(
    modules = {
        AppModule.class
    }
)
public interface AppComponent {
  void inject(Exponent exponent);

  Kernel getKernel();

  ExponentManifest getExponentManifest();

  void inject(LauncherActivity activity);

  void inject(ExponentDevActivity activity);

  void inject(ExponentIntentService service);

  void inject(RegistrationIntentService service);

  void inject(ExponentGcmListenerService service);

  void inject(BaseExperienceActivity activity);

  void inject(ExperienceActivity activity);

  void inject(ErrorActivity activity);

  void inject(InfoActivity activity);

  void inject(ExponentKernelModule module);

  void inject(URLHandlerModule module);
  void inject(abi10_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi9_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.URLHandlerModule module);

  void inject(NotificationsModule module);
  void inject(abi10_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi9_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.NotificationsModule module);

  void inject(ConstantsModule module);
  void inject(abi10_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi9_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.ConstantsModule module);

  void inject(ExponentIntentModule module);
  void inject(abi10_0_0.host.exp.exponent.modules.internal.ExponentIntentModule module);
  void inject(abi9_0_0.host.exp.exponent.modules.internal.ExponentIntentModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.internal.ExponentIntentModule module);

  void inject(UtilModule module);
  void inject(abi10_0_0.host.exp.exponent.modules.api.UtilModule module);
}
