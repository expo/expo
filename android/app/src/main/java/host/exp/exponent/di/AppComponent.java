// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.di;

import javax.inject.Singleton;

import dagger.Component;
import host.exp.exponent.ExponentApplication;
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
import host.exp.exponent.referrer.InstallReferrerReceiver;
import versioned.host.exp.exponent.modules.api.URLHandlerModule;
import versioned.host.exp.exponent.modules.api.ConstantsModule;
import versioned.host.exp.exponent.modules.api.NotificationsModule;
import versioned.host.exp.exponent.modules.internal.ExponentIntentModule;

@Singleton
@Component(
    modules = {
        AppModule.class
    }
)
public interface AppComponent {
  void inject(ExponentApplication application);

  void inject(LauncherActivity activity);

  void inject(BaseExperienceActivity activity);

  void inject(ExponentDevActivity activity);

  void inject(ExponentKernelModule module);

  void inject(ExperienceActivity activity);

  void inject(ExponentIntentService service);

  void inject(ErrorActivity activity);

  void inject(InfoActivity activity);

  void inject(RegistrationIntentService service);

  void inject(ExponentGcmListenerService service);

  void inject(InstallReferrerReceiver receiver);

  Kernel getKernel();

  ExponentManifest getExponentManifest();

  void inject(abi5_0_0.host.exp.exponent.modules.ExponentVersionsModule module);

  void inject(URLHandlerModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.URLHandlerModule module);
  void inject(abi5_0_0.host.exp.exponent.modules.ExURLHandlerModule module);

  void inject(NotificationsModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.NotificationsModule module);
  void inject(abi5_0_0.host.exp.exponent.modules.ExponentNotificationsModule module);

  void inject(ConstantsModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi7_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi6_0_0.host.exp.exponent.modules.api.ConstantsModule module);
  void inject(abi5_0_0.host.exp.exponent.modules.ExponentConstantsModule module);

  void inject(ExponentIntentModule module);
  void inject(abi8_0_0.host.exp.exponent.modules.internal.ExponentIntentModule module);
}
