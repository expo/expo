package versioned.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.interfaces.sensors.services.GyroscopeService;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedGyroscopeService extends BaseSensorService implements InternalModule, GyroscopeService {
  public ScopedGyroscopeService(ExperienceId experienceId) {
    super(experienceId);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getGyroscopeKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(GyroscopeService.class);
  }
}

