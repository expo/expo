// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.appdi;

import javax.inject.Singleton;

import dagger.Component;
import host.exp.exponent.referrer.InstallReferrerReceiver;

@Singleton
@Component(
    modules = {
        ExponentAppModule.class
    }
)
public interface ExponentAppComponent {

  void inject(InstallReferrerReceiver receiver);
}
