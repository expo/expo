package versioned.host.exp.exponent.modules;

import android.view.View;

import com.facebook.react.uimanager.SimpleViewManager;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;

public abstract class ExpoKernelServiceConsumerViewManager<T extends View> extends SimpleViewManager<T> {
  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  protected final ExperienceId experienceId;

  public ExpoKernelServiceConsumerViewManager(ExperienceId experienceId) {
    super();
    this.experienceId = experienceId;
    NativeModuleDepsProvider.getInstance().inject(ExpoKernelServiceConsumerViewManager.class, this);
  }
}
