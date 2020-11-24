package abi40_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi40_0_0.org.unimodules.core.interfaces.InternalModule;
import abi40_0_0.org.unimodules.interfaces.sensors.services.AccelerometerService;
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
