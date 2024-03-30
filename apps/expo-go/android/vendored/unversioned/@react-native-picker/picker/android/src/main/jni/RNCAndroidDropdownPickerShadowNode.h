#pragma once

#include <react/renderer/components/rnpicker/EventEmitters.h>
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include "RNCAndroidDropdownPickerMeasurementsManager.h"
#include "RNCAndroidDropdownPickerState.h"

namespace facebook::react {

extern const char RNCAndroidDropdownPickerComponentName[];

class RNCAndroidDropdownPickerShadowNode final
    : public ConcreteViewShadowNode<
          RNCAndroidDropdownPickerComponentName,
          RNCAndroidDropdownPickerProps,
          RNCAndroidDropdownPickerEventEmitter,
          RNCAndroidDropdownPickerState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
  // Associates a shared `RNCAndroidDropdownPickerMeasurementsManager` with the
  // node.
  void setDropdownPickerMeasurementsManager(
      const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>&
          measurementsManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

 private:
  std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>
      measurementsManager_;
};

} // namespace facebook::react
