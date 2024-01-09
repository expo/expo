#include "RNCAndroidDropdownPickerShadowNode.h"

namespace facebook
{
    namespace react
    {

        extern const char RNCAndroidDropdownPickerComponentName[] = "RNCAndroidDropdownPicker";

        void RNCAndroidDropdownPickerShadowNode::setDropdownPickerMeasurementsManager(
            const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>
                &measurementsManager)
        {
            ensureUnsealed();
            measurementsManager_ = measurementsManager;
        }

#pragma mark - LayoutableShadowNode

        Size RNCAndroidDropdownPickerShadowNode::measureContent(
            LayoutContext const &layoutContext,
            LayoutConstraints const &layoutConstraints) const
        {
            return measurementsManager_->measure(getSurfaceId(), layoutConstraints, getConcreteProps(), getStateData());
        }
    } // namespace react
} // namespace facebook
