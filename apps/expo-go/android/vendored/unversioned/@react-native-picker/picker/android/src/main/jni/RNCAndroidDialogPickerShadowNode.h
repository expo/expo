#pragma once

#include "RNCAndroidDialogPickerMeasurementsManager.h"
#include "RNCAndroidDialogPickerState.h"

#include <react/renderer/components/rnpicker/EventEmitters.h>
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char RNCAndroidDialogPickerComponentName[];

class RNCAndroidDialogPickerShadowNode final
    : public ConcreteViewShadowNode<
          RNCAndroidDialogPickerComponentName,
          RNCAndroidDialogPickerProps,
          RNCAndroidDialogPickerEventEmitter,
          RNCAndroidDialogPickerState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
  // Associates a shared `RNCAndroidDialogPickerMeasurementsManager` with the
  // node.
  void setDialogPickerMeasurementsManager(
      const std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager>&
          measurementsManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

 private:
  std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager>
      measurementsManager_;
};

} // namespace facebook::react
