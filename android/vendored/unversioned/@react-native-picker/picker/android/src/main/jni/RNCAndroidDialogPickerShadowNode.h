#pragma once

#include "RNCAndroidDialogPickerState.h"
#include "RNCAndroidDialogPickerMeasurementsManager.h"
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

    JSI_EXPORT extern const char RNCAndroidDialogPickerComponentName[];

    class JSI_EXPORT RNCAndroidDialogPickerShadowNode final : public ConcreteViewShadowNode<
                                                                  RNCAndroidDialogPickerComponentName,
                                                                  RNCAndroidDialogPickerProps,
                                                                  RNCAndroidDialogPickerEventEmitter,
                                                                  RNCAndroidDialogPickerState>
    {
    public:
      using ConcreteViewShadowNode::ConcreteViewShadowNode;
      // Associates a shared `RNCAndroidDialogPickerMeasurementsManager` with the node.
      void setDialogPickerMeasurementsManager(
          const std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager>
              &measurementsManager);

#pragma mark - LayoutableShadowNode

      Size measureContent(
          LayoutContext const &layoutContext,
          LayoutConstraints const &layoutConstraints) const override;

    private:
      std::shared_ptr<RNCAndroidDialogPickerMeasurementsManager> measurementsManager_;
    };

  } // namespace react
} // namespace facebook
