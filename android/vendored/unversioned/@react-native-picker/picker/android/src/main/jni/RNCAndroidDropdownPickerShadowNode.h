#pragma once

#include "RNCAndroidDropdownPickerState.h"
#include "RNCAndroidDropdownPickerMeasurementsManager.h"
#include <react/renderer/components/rnpicker/EventEmitters.h>
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <jsi/jsi.h>
#include <yoga/Yoga.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook
{
  namespace react
  {

    JSI_EXPORT extern const char RNCAndroidDropdownPickerComponentName[];

    class JSI_EXPORT RNCAndroidDropdownPickerShadowNode final : public ConcreteViewShadowNode<
                                                                    RNCAndroidDropdownPickerComponentName,
                                                                    RNCAndroidDropdownPickerProps,
                                                                    RNCAndroidDropdownPickerEventEmitter,
                                                                    RNCAndroidDropdownPickerState>
    {
    public:
      using ConcreteViewShadowNode::ConcreteViewShadowNode;
      // Associates a shared `RNCAndroidDropdownPickerMeasurementsManager` with the node.
      void setDropdownPickerMeasurementsManager(
          const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager>
              &measurementsManager);

#pragma mark - LayoutableShadowNode

      Size measureContent(
          LayoutContext const &layoutContext,
          LayoutConstraints const &layoutConstraints) const override;

    private:
      std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager> measurementsManager_;
    };

  } // namespace react
} // namespace facebook
