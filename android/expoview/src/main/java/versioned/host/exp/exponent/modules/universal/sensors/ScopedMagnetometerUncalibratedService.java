package versioned.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.MagnetometerUncalibratedServiceInterface;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.kernel.services.sensors.SubscribableSensorKernelService;

public class ScopedMagnetometerUncalibratedService extends BaseSensorService implements InternalModule, MagnetometerUncalibratedServiceInterface {
  public ScopedMagnetometerUncalibratedService(ExperienceKey experienceKey) {
    super(experienceKey);
  }

  @Override
  protected SubscribableSensorKernelService getSensorKernelService() {
    return getKernelServiceRegistry().getMagnetometerUncalibratedKernelService();
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(MagnetometerUncalibratedServiceInterface.class);
  }
}

