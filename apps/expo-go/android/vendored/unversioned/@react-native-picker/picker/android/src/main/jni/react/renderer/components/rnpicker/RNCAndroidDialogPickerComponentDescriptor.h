#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "RNCAndroidDialogPickerMeasurementsManager.h"
#include "RNCAndroidDialogPickerShadowNode.h"

namespace facebook::react {

class RNCAndroidDialogPickerComponentDescriptor final
    : public ConcreteComponentDescriptor<RNCAndroidDialogPickerShadowNode> {
 public:
  RNCAndroidDialogPickerComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(
            std::make_shared<RNCAndroidDialogPickerMeasurementsManager>(
                contextContainer_)) {}

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);
    auto& pickerShadowNode =
        static_cast<RNCAndroidDialogPickerShadowNode&>(shadowNode);

    // `RNCAndroidDialogPickerShadowNode` uses
    // `RNCAndroidDialogPickerMeasurementsManager` to provide measurements to
    // Yoga.
    pickerShadowNode.setDialogPickerMeasurementsManager(measurementsManager_);

    // All `RNCAndroidDialogPickerShadowNode`s must have leaf Yoga nodes with
    // properly setup measure function.
    pickerShadowNode.enableMeasurement();
    pickerShadowNode.dirtyLayout();
  }

 private:
  const std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager>
      measurementsManager_;
};

} // namespace facebook::react
