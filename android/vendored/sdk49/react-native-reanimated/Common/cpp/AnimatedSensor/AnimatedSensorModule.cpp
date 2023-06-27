#include "AnimatedSensorModule.h"

#include <memory>
#include <utility>

#include "Shareables.h"

namespace reanimated {

AnimatedSensorModule::AnimatedSensorModule(
    const PlatformDepMethodsHolder &platformDepMethodsHolder)
    : platformRegisterSensorFunction_(platformDepMethodsHolder.registerSensor),
      platformUnregisterSensorFunction_(
          platformDepMethodsHolder.unregisterSensor) {}

AnimatedSensorModule::~AnimatedSensorModule() {
  assert(sensorsIds_.empty());
}

jsi::Value AnimatedSensorModule::registerSensor(
    jsi::Runtime &rt,
    const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
    const jsi::Value &sensorTypeValue,
    const jsi::Value &interval,
    const jsi::Value &iosReferenceFrame,
    const jsi::Value &sensorDataHandler) {
  SensorType sensorType = static_cast<SensorType>(sensorTypeValue.asNumber());

  auto shareableHandler = extractShareableOrThrow(rt, sensorDataHandler);

  int sensorId = platformRegisterSensorFunction_(
      sensorType,
      interval.asNumber(),
      iosReferenceFrame.asNumber(),
      [sensorType,
       shareableHandler,
       weakRuntimeHelper = std::weak_ptr<JSRuntimeHelper>(runtimeHelper)](
          double newValues[], int orientationDegrees) {
        auto runtimeHelper = weakRuntimeHelper.lock();
        if (runtimeHelper == nullptr || runtimeHelper->uiRuntimeDestroyed) {
          return;
        }

        auto &rt = *runtimeHelper->uiRuntime();
        auto handler = shareableHandler->getJSValue(rt);
        if (sensorType == SensorType::ROTATION_VECTOR) {
          jsi::Object value(rt);
          // TODO: timestamp should be provided by the platform implementation
          // such that the native side has a chance of providing a true event
          // timestamp
          value.setProperty(rt, "qx", newValues[0]);
          value.setProperty(rt, "qy", newValues[1]);
          value.setProperty(rt, "qz", newValues[2]);
          value.setProperty(rt, "qw", newValues[3]);
          value.setProperty(rt, "yaw", newValues[4]);
          value.setProperty(rt, "pitch", newValues[5]);
          value.setProperty(rt, "roll", newValues[6]);
          value.setProperty(rt, "interfaceOrientation", orientationDegrees);
          runtimeHelper->runOnUIGuarded(handler, value);
        } else {
          jsi::Object value(rt);
          value.setProperty(rt, "x", newValues[0]);
          value.setProperty(rt, "y", newValues[1]);
          value.setProperty(rt, "z", newValues[2]);
          value.setProperty(rt, "interfaceOrientation", orientationDegrees);
          runtimeHelper->runOnUIGuarded(handler, value);
        }
      });
  if (sensorId != -1) {
    sensorsIds_.insert(sensorId);
  }
  return jsi::Value(sensorId);
}

void AnimatedSensorModule::unregisterSensor(const jsi::Value &sensorId) {
  // It is called during sensor hook unmounting
  sensorsIds_.erase(sensorId.getNumber());
  platformUnregisterSensorFunction_(sensorId.asNumber());
}

void AnimatedSensorModule::unregisterAllSensors() {
  for (auto sensorId : sensorsIds_) {
    platformUnregisterSensorFunction_(sensorId);
  }
  sensorsIds_.clear();
}

} // namespace reanimated
