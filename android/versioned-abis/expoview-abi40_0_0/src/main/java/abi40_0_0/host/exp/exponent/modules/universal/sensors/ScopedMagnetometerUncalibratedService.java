package abi40_0_0.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import abi40_0_0.org.unimodules.core.interfaces.InternalModule;
import abi40_0_0.org.unimodules.interfaces.sensors.services.MagnetometerUncalibratedService;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedMagnetometerUncalibratedService extends BaseSensorService implements InternalModule, MagnetometerUncalibratedService {
  public ScopedMagnetometerUncalibratedService(ExperienceKey experienceKey) {
    super(experienceKey);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getMagnetometerUncalibratedKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(MagnetometerUncalibratedService.class);
  }
}

