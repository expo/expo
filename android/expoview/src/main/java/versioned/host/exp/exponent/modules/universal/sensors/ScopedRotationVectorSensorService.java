package versioned.host.exp.exponent.modules.universal.sensors;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;

import expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface;
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

