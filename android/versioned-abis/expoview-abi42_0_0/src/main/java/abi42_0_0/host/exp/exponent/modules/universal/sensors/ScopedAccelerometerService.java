package abi42_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.interfaces.InternalModule;

import abi42_0_0.expo.modules.interfaces.sensors.services.AccelerometerServiceInterface;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedAccelerometerService extends BaseSensorService implements InternalModule, AccelerometerServiceInterface {
  public ScopedAccelerometerService(ExperienceId experienceId) {
    super(experienceId);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getAccelerometerKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(AccelerometerServiceInterface.class);
  }
}
