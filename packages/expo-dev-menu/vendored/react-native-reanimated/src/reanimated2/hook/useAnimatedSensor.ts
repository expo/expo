import { useEffect, useRef } from 'react';
import { makeMutable } from '../core';
import NativeReanimated from '../NativeReanimated';
import { SensorValue3D, SensorValueRotation } from '../commonTypes';

export enum SensorType {
  ACCELEROMETER = 1,
  GYROSCOPE = 2,
  GRAVITY = 3,
  MAGNETIC_FIELD = 4,
  ROTATION = 5,
}

export type SensorConfig = {
  interval: number;
};

export type AnimatedSensor = {
  sensor: SensorValue3D | SensorValueRotation | null;
  unregister: () => void;
  isAvailable: boolean;
  config: SensorConfig;
};

export function useAnimatedSensor(
  sensorType: SensorType,
  userConfig?: SensorConfig
): AnimatedSensor {
  const ref = useRef({
    sensor: null,
    unregister: () => {
      // NOOP
    },
    isAvailable: false,
    config: {
      interval: 0,
    },
  });

  if (ref.current.sensor === null) {
    ref.current.config = { interval: 10, ...userConfig };
    let sensorData;
    if (sensorType === SensorType.ROTATION) {
      sensorData = {
        qw: 0,
        qx: 0,
        qy: 0,
        qz: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
      };
    } else {
      sensorData = {
        x: 0,
        y: 0,
        z: 0,
      };
    }
    ref.current.sensor = makeMutable(sensorData) as any;
  }

  useEffect(() => {
    ref.current.config = { interval: 10, ...userConfig };
    const id = NativeReanimated.registerSensor(
      sensorType,
      ref.current.config.interval,
      ref.current.sensor as any
    );

    if (id !== -1) {
      // if sensor is available
      ref.current.unregister = () => NativeReanimated.unregisterSensor(id);
      ref.current.isAvailable = true;
    } else {
      // if sensor is unavailable
      ref.current.unregister = () => {
        // NOOP
      };
      ref.current.isAvailable = false;
    }

    return () => {
      ref.current.unregister();
    };
  }, [sensorType, userConfig]);

  return ref.current;
}
