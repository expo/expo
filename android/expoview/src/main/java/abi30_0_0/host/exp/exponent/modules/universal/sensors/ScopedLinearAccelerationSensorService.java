package abi30_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi30_0_0.expo.core.interfaces.InternalModule;
import abi30_0_0.expo.interfaces.sensors.services.LinearAccelerationSensorService;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedLinearAccelerationSensorService extends BaseSensorService implements InternalModule, LinearAccelerationSensorService {
  public ScopedLinearAccelerationSensorService(ExperienceId experienceId) {
    super(experienceId);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getLinearAccelerationSensorKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(LinearAccelerationSensorService.class);
  }
}

