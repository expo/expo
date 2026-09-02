// Copyright 2018-present 650 Industries. All rights reserved.

#include "ExpoComponentDescriptorFactory.h"
#include "AndroidExpoViewComponentDescriptor.h"

namespace react = facebook::react;

namespace expo {

StatePropMapType statePropMap = {};

react::ComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
) {
  auto descriptor = std::make_unique<AndroidExpoViewComponentDescriptor>(
    parameters,
    react::RawPropsParser(/*useRawPropsJsiValue=*/true)
  );

  if (statePropMap.contains(std::static_pointer_cast<std::string const>(parameters.flavor))) {
    descriptor->setStateProps(
      statePropMap.at(
        std::static_pointer_cast<std::string const>(parameters.flavor)
      )
    );
  }

  return descriptor;
}

} // namespace expo
