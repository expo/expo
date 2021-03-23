package abi41_0_0.expo.modules.sensors;

import android.content.Context;

import java.util.Arrays;
import java.util.List;

import abi41_0_0.org.unimodules.core.BasePackage;
import abi41_0_0.org.unimodules.core.ExportedModule;
import abi41_0_0.org.unimodules.core.interfaces.InternalModule;
import abi41_0_0.expo.modules.sensors.modules.AccelerometerModule;
import abi41_0_0.expo.modules.sensors.modules.BarometerModule;
import abi41_0_0.expo.modules.sensors.modules.DeviceMotionModule;
import abi41_0_0.expo.modules.sensors.modules.GyroscopeModule;
import abi41_0_0.expo.modules.sensors.modules.MagnetometerModule;
import abi41_0_0.expo.modules.sensors.modules.MagnetometerUncalibratedModule;
import abi41_0_0.expo.modules.sensors.modules.PedometerModule;
import abi41_0_0.expo.modules.sensors.services.AccelerometerService;
import abi41_0_0.expo.modules.sensors.services.BarometerService;
import abi41_0_0.expo.modules.sensors.services.GravitySensorService;
import abi41_0_0.expo.modules.sensors.services.GyroscopeService;
import abi41_0_0.expo.modules.sensors.services.LinearAccelerationSensorService;
import abi41_0_0.expo.modules.sensors.services.MagnetometerService;
import abi41_0_0.expo.modules.sensors.services.MagnetometerUncalibratedService;
import abi41_0_0.expo.modules.sensors.services.PedometerService;
import abi41_0_0.expo.modules.sensors.services.RotationVectorSensorService;

public class SensorsPackage extends BasePackage {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Arrays.<InternalModule>asList(
            new AccelerometerService(context),
            new BarometerService(context),
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
            new BarometerModule(context),
            new GyroscopeModule(context),
            new DeviceMotionModule(context),
            new MagnetometerModule(context),
            new MagnetometerUncalibratedModule(context),
            new PedometerModule(context)
    );
  }
}
