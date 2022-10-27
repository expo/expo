#include "AnimatedSensorModule.h"
#include "MutableValue.h"
#include "ValueWrapper.h"

#include <memory>
#include <utility>

namespace reanimated {

AnimatedSensorModule::AnimatedSensorModule(
    const PlatformDepMethodsHolder &platformDepMethodsHolder,
    RuntimeManager *runtimeManager)
    : platformRegisterSensorFunction_(platformDepMethodsHolder.registerSensor),
      platformUnregisterSensorFunction_(
          platformDepMethodsHolder.unregisterSensor),
      runtimeManager_(runtimeManager) {}

AnimatedSensorModule::~AnimatedSensorModule() {
  // It is called during app reload because app reload doesn't call hooks
  // unmounting
  for (auto sensorId : sensorsIds_) {
    platformUnregisterSensorFunction_(sensorId);
  }
}

jsi::Value AnimatedSensorModule::registerSensor(
    jsi::Runtime &rt,
    const jsi::Value &sensorType,
    const jsi::Value &interval,
    const jsi::Value &sensorDataContainer) {
  std::shared_ptr<ShareableValue> sensorsData = ShareableValue::adapt(
      rt, sensorDataContainer.getObject(rt), runtimeManager_);
  auto &mutableObject =
      ValueWrapper::asMutableValue(sensorsData->valueContainer);

  std::function<void(double[])> setter;
  if (sensorType.asNumber() == SensorType::ROTATION_VECTOR) {
    setter = [&, mutableObject](double newValues[]) {
      jsi::Runtime &runtime = *runtimeManager_->runtime.get();
      jsi::Object value(runtime);
      value.setProperty(runtime, "qx", newValues[0]);
      value.setProperty(runtime, "qy", newValues[1]);
      value.setProperty(runtime, "qz", newValues[2]);
      value.setProperty(runtime, "qw", newValues[3]);
      value.setProperty(runtime, "yaw", newValues[4]);
      value.setProperty(runtime, "pitch", newValues[5]);
      value.setProperty(runtime, "roll", newValues[6]);
      mutableObject->setValue(runtime, std::move(value));
    };
  } else {
    setter = [&, mutableObject](double newValues[]) {
      jsi::Runtime &runtime = *runtimeManager_->runtime.get();
      jsi::Object value(runtime);
      value.setProperty(runtime, "x", newValues[0]);
      value.setProperty(runtime, "y", newValues[1]);
      value.setProperty(runtime, "z", newValues[2]);
      mutableObject->setValue(runtime, std::move(value));
    };
  }

  int sensorId = platformRegisterSensorFunction_(
      sensorType.asNumber(), interval.asNumber(), setter);
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

} // namespace reanimated
