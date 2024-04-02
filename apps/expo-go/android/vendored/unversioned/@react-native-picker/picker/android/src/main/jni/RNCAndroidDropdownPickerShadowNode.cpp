#include "RNCAndroidDropdownPickerShadowNode.h"

#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

extern const char RNCAndroidDropdownPickerComponentName[] =
    "RNCAndroidDropdownPicker";

void RNCAndroidDropdownPickerShadowNode::setDropdownPickerMeasurementsManager(
    const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>&
        measurementsManager) {
  ensureUnsealed();
  measurementsManager_ = measurementsManager;
}

#pragma mark - LayoutableShadowNode

Size RNCAndroidDropdownPickerShadowNode::measureContent(
    LayoutContext const& layoutContext,
    LayoutConstraints const& layoutConstraints) const {
  return measurementsManager_->measure(
      getSurfaceId(), layoutConstraints, getConcreteProps(), getStateData());
}

} // namespace facebook::react
