#include "RNCAndroidDialogPickerShadowNode.h"

#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

extern const char RNCAndroidDialogPickerComponentName[] =
    "RNCAndroidDialogPicker";

void RNCAndroidDialogPickerShadowNode::setDialogPickerMeasurementsManager(
    const std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager>&
        measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

#pragma mark - LayoutableShadowNode

Size RNCAndroidDialogPickerShadowNode::measureContent(
    LayoutContext const& layoutContext,
    LayoutConstraints const& layoutConstraints) const {
  return measurementsManager_->measure(
      getSurfaceId(), layoutConstraints, getConcreteProps(), getStateData());
}

} // namespace facebook::react
