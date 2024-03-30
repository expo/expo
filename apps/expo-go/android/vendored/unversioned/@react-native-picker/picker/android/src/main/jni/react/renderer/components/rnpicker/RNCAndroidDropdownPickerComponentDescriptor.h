#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "RNCAndroidDropdownPickerMeasurementsManager.h"
#include "RNCAndroidDropdownPickerShadowNode.h"

namespace facebook::react {

class RNCAndroidDropdownPickerComponentDescriptor final
    : public ConcreteComponentDescriptor<RNCAndroidDropdownPickerShadowNode> {
 public:
  RNCAndroidDropdownPickerComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(
            std::make_shared<RNCAndroidDropdownPickerMeasurementsManager>(
                contextContainer_)) {}

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);
    auto& pickerShadowNode =
        static_cast<RNCAndroidDropdownPickerShadowNode&>(shadowNode);

    // `RNCAndroidDropdownPickerShadowNode` uses
    // `RNCAndroidDropdownPickerMeasurementsManager` to provide measurements to
    // Yoga.
    pickerShadowNode.setDropdownPickerMeasurementsManager(measurementsManager_);

    // All `RNCAndroidDropdownPickerShadowNode`s must have leaf Yoga nodes with
    // properly setup measure function.
    pickerShadowNode.enableMeasurement();
    pickerShadowNode.dirtyLayout();
  }

 private:
  const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>
      measurementsManager_;
};
} // namespace facebook::react
