package abi29_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi29_0_0.expo.core.interfaces.InternalModule;
import abi29_0_0.expo.interfaces.sensors.services.AccelerometerService;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedAccelerometerService extends BaseSensorService implements InternalModule, AccelerometerService {
  public ScopedAccelerometerService(ExperienceId experienceId) {
    super(experienceId);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getAccelerometerKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(AccelerometerService.class);
  }
}
