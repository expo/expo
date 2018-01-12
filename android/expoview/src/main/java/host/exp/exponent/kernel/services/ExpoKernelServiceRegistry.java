// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel.services;

import android.content.Context;

import host.exp.exponent.kernel.services.sensors.AccelerometerKernelService;
import host.exp.exponent.kernel.services.sensors.GravitySensorKernelService;
import host.exp.exponent.kernel.services.sensors.GyroscopeKernelService;
import host.exp.exponent.kernel.services.sensors.LinearAccelerationSensorKernelService;
import host.exp.exponent.kernel.services.sensors.MagnetometerKernelService;
import host.exp.exponent.kernel.services.sensors.MagnetometerUncalibratedKernelService;
import host.exp.exponent.kernel.services.sensors.RotationVectorSensorKernelService;

public class ExpoKernelServiceRegistry {
  private GyroscopeKernelService mGyroscopeKernelService = null;
  private MagnetometerKernelService mMagnetometerKernelService = null;
  private AccelerometerKernelService mAccelerometerKernelService = null;
  private GravitySensorKernelService mGravitySensorKernelService = null;
  private RotationVectorSensorKernelService mRotationVectorSensorKernelService = null;
  private LinearAccelerationSensorKernelService mLinearAccelerationSensorKernelService = null;
  private MagnetometerUncalibratedKernelService mMagnetometerUncalibratedKernelService = null;

  public ExpoKernelServiceRegistry(Context context) {
    mGyroscopeKernelService = new GyroscopeKernelService(context);
    mMagnetometerKernelService = new MagnetometerKernelService(context);
    mAccelerometerKernelService = new AccelerometerKernelService(context);
    mGravitySensorKernelService = new GravitySensorKernelService(context);
    mRotationVectorSensorKernelService = new RotationVectorSensorKernelService(context);
    mLinearAccelerationSensorKernelService = new LinearAccelerationSensorKernelService(context);
    mMagnetometerUncalibratedKernelService = new MagnetometerUncalibratedKernelService(context);
  }

  public GyroscopeKernelService getGyroscopeKernelService() {
    return mGyroscopeKernelService;
  }


  public MagnetometerKernelService getMagnetometerKernelService() {
    return mMagnetometerKernelService;
  }

  public AccelerometerKernelService getAccelerometerKernelService() {
    return mAccelerometerKernelService;
  }

  public GravitySensorKernelService getGravitySensorKernelService() {
    return mGravitySensorKernelService;
  }

  public RotationVectorSensorKernelService getRotationVectorSensorKernelService() {
    return mRotationVectorSensorKernelService;
  }

  public LinearAccelerationSensorKernelService getLinearAccelerationSensorKernelService() {
    return mLinearAccelerationSensorKernelService;
  }

  public MagnetometerUncalibratedKernelService getMagnetometerUncalibratedKernelService() {
    return mMagnetometerUncalibratedKernelService;
  }
}
