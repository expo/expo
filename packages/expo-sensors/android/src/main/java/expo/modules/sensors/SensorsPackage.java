package expo.modules.sensors;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import expo.core.BasePackage;
import expo.core.ExportedModule;
import expo.core.interfaces.InternalModule;
import expo.modules.sensors.modules.AccelerometerModule;
import expo.modules.sensors.modules.DeviceMotionModule;
import expo.modules.sensors.modules.GyroscopeModule;
import expo.modules.sensors.modules.MagnetometerModule;
import expo.modules.sensors.modules.MagnetometerUncalibratedModule;
import expo.modules.sensors.modules.PedometerModule;
import expo.modules.sensors.services.AccelerometerService;
import expo.modules.sensors.services.GravitySensorService;
import expo.modules.sensors.services.GyroscopeService;
import expo.modules.sensors.services.LinearAccelerationSensorService;
import expo.modules.sensors.services.MagnetometerService;
import expo.modules.sensors.services.MagnetometerUncalibratedService;
import expo.modules.sensors.services.PedometerService;
import expo.modules.sensors.services.RotationVectorSensorService;

public class SensorsPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.<InternalModule>asList(
            new AccelerometerService(context),
            new GravitySensorService(context),
            new GyroscopeService(context),
            new LinearAccelerationSensorService(context),
            new MagnetometerService(context),
            new MagnetometerUncalibratedService(context),
            new RotationVectorSensorService(context),
            new PedometerService(context)
    );
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Arrays.<ExportedModule>asList(
            new AccelerometerModule(context),
            new GyroscopeModule(context),
            new DeviceMotionModule(context),
            new MagnetometerModule(context),
            new MagnetometerUncalibratedModule(context),
            new PedometerModule(context)
    );
  }
}