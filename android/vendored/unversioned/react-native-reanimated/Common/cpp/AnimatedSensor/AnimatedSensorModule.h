#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <unordered_set>

#include "PlatformDepMethodsHolder.h"
#include "Shareables.h"
#include "WorkletRuntime.h"

namespace reanimated {

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

 public:
  AnimatedSensorModule(
      const PlatformDepMethodsHolder &platformDepMethodsHolder);
  ~AnimatedSensorModule();

  jsi::Value registerSensor(
      jsi::Runtime &rt,
      const std::shared_ptr<WorkletRuntime> &uiWorkletRuntime,
      const jsi::Value &sensorType,
      const jsi::Value &interval,
      const jsi::Value &iosReferenceFrame,
      const jsi::Value &sensorDataContainer);
  void unregisterSensor(const jsi::Value &sensorId);
  void unregisterAllSensors();
};

} // namespace reanimated
