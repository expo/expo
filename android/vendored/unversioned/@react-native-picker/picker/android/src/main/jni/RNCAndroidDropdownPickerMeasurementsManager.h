#pragma once

#include "conversions.h"
#include "RNCAndroidDropdownPickerState.h"
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>

namespace facebook
{
    namespace react
    {

        class RNCAndroidDropdownPickerMeasurementsManager
        {
        public:
            RNCAndroidDropdownPickerMeasurementsManager(
                const ContextContainer::Shared &contextContainer)
                : contextContainer_(contextContainer) {}

            Size measure(SurfaceId surfaceId, LayoutConstraints layoutConstraints, RNCAndroidDropdownPickerProps props, RNCAndroidDropdownPickerState state) const;

        private:
            const ContextContainer::Shared contextContainer_;
        };

    } // namespace react
} // namespace facebook
