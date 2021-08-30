package abi39_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi39_0_0.org.unimodules.core.interfaces.InternalModule;
import abi39_0_0.org.unimodules.interfaces.sensors.services.AccelerometerService;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedAccelerometerService extends BaseSensorService implements InternalModule, AccelerometerService {
  public ScopedAccelerometerService(ExperienceKey experienceKey) {
    super(experienceKey);
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
