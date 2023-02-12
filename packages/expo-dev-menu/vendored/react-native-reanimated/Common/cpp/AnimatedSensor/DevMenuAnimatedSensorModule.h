#pragma once

#include <jsi/jsi.h>
#include <unordered_set>

#include "DevMenuPlatformDepMethodsHolder.h"
#include "DevMenuRuntimeManager.h"

namespace devmenureanimated {

using namespace facebook;

enum SensorType {
  ACCELEROMETER = 1,
  GYROSCOPE = 2,
  GRAVITY = 3,
  MAGNETIC_FIELD = 4,
  ROTATION_VECTOR = 5,
};

class AnimatedSensorModule {
  std::unordered_set<int> sensorsIds_;
  RegisterSensorFunction platformRegisterSensorFunction_;
  UnregisterSensorFunction platformUnregisterSensorFunction_;
  RuntimeManager *runtimeManager_;

 public:
  AnimatedSensorModule(
      const PlatformDepMethodsHolder &platformDepMethodsHolder,
      RuntimeManager *runtimeManager);
  ~AnimatedSensorModule();

  jsi::Value registerSensor(
      jsi::Runtime &rt,
      const jsi::Value &sensorType,
      const jsi::Value &interval,
      const jsi::Value &sensorDataContainer);
  void unregisterSensor(const jsi::Value &sensorId);
};

} // namespace devmenureanimated
