#pragma once

#include <react/debug/react_native_assert.h>
#include "RNCAndroidDropdownPickerShadowNode.h"
#include "RNCAndroidDropdownPickerMeasurementsManager.h"
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/components/rnpicker/Props.h>

namespace facebook
{
    namespace react
    {

        class RNCAndroidDropdownPickerComponentDescriptor final
            : public ConcreteComponentDescriptor<RNCAndroidDropdownPickerShadowNode>
        {
        public:
            RNCAndroidDropdownPickerComponentDescriptor(
                ComponentDescriptorParameters const &parameters)
                : ConcreteComponentDescriptor(parameters),
                  measurementsManager_(std::make_shared<RNCAndroidDropdownPickerMeasurementsManager>(
                      contextContainer_)) {}

            void adopt(ShadowNode& shadowNode) const override
            {
                assert(dynamic_cast<RNCAndroidDropdownPickerShadowNode*>(&shadowNode));
                auto& pickerShadowNode =
                    static_cast<RNCAndroidDropdownPickerShadowNode&>(shadowNode);

                // `RNCAndroidDropdownPickerShadowNode` uses `RNCAndroidDropdownPickerMeasurementsManager` to
                // provide measurements to Yoga.
                pickerShadowNode.setDropdownPickerMeasurementsManager(measurementsManager_);

                // All `RNCAndroidDropdownPickerShadowNode`s must have leaf Yoga nodes with properly
                // setup measure function.
                pickerShadowNode.enableMeasurement();
                pickerShadowNode.dirtyLayout();
                ConcreteComponentDescriptor::adopt(shadowNode);
            }

        private:
            const std::shared_ptr<RNCAndroidDropdownPickerMeasurementsManager> measurementsManager_;
        };
    } // namespace react
} // namespace facebook
