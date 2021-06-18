package versioned.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.GyroscopeServiceInterface;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedGyroscopeService extends BaseSensorService implements InternalModule, GyroscopeServiceInterface {
  public ScopedGyroscopeService(ExperienceKey experienceKey) {
    super(experienceKey);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getGyroscopeKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(GyroscopeServiceInterface.class);
  }
}

