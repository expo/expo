#pragma once

#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/utils/ContextContainer.h>
#include "RNCAndroidDialogPickerState.h"
#include "conversions.h"

namespace facebook::react {

class RNCAndroidDialogPickerMeasurementsManager {
 public:
  RNCAndroidDialogPickerMeasurementsManager(
      const ContextContainer::Shared& contextContainer)
      : contextContainer_(contextContainer) {}

  Size measure(
      SurfaceId surfaceId,
      LayoutConstraints layoutConstraints,
      const RNCAndroidDialogPickerProps& props,
      RNCAndroidDialogPickerState state) const;

 private:
  const ContextContainer::Shared contextContainer_;
};
} // namespace facebook::react
