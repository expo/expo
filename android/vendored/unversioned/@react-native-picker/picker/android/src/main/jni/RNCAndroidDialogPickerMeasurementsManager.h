#pragma once

#include "conversions.h"
#include "RNCAndroidDialogPickerState.h"
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>

namespace facebook
{
    namespace react
    {

        class RNCAndroidDialogPickerMeasurementsManager
        {
        public:
            RNCAndroidDialogPickerMeasurementsManager(
                const ContextContainer::Shared &contextContainer)
                : contextContainer_(contextContainer) {}

            Size measure(SurfaceId surfaceId, LayoutConstraints layoutConstraints, RNCAndroidDialogPickerProps props, RNCAndroidDialogPickerState state) const;

        private:
            const ContextContainer::Shared contextContainer_;
        };

    } // namespace react
} // namespace facebook
