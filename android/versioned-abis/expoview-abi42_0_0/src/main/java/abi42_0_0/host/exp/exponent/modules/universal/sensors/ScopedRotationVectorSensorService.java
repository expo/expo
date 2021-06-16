package abi42_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi42_0_0.org.unimodules.core.interfaces.InternalModule;

import abi42_0_0.expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedRotationVectorSensorService extends BaseSensorService implements InternalModule, RotationVectorSensorServiceInterface {
  public ScopedRotationVectorSensorService(ExperienceId experienceId) {
    super(experienceId);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getRotationVectorSensorKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(RotationVectorSensorServiceInterface.class);
  }
}

