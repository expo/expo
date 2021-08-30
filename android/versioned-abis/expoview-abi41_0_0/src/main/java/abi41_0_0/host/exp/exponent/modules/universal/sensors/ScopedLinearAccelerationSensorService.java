package abi41_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi41_0_0.org.unimodules.core.interfaces.InternalModule;
import abi41_0_0.org.unimodules.interfaces.sensors.services.LinearAccelerationSensorService;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedLinearAccelerationSensorService extends BaseSensorService implements InternalModule, LinearAccelerationSensorService {
  public ScopedLinearAccelerationSensorService(ExperienceKey experienceKey) {
    super(experienceKey);
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

