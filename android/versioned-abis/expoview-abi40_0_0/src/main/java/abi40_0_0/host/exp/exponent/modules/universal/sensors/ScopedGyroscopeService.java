package abi40_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi40_0_0.org.unimodules.core.interfaces.InternalModule;
import abi40_0_0.org.unimodules.interfaces.sensors.services.GyroscopeService;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedGyroscopeService extends BaseSensorService implements InternalModule, GyroscopeService {
  public ScopedGyroscopeService(ExperienceKey experienceKey) {
    super(experienceKey);
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

