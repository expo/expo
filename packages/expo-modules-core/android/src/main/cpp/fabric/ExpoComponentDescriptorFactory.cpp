// Copyright 2018-present 650 Industries. All rights reserved.

#include "ExpoComponentDescriptorFactory.h"
#include "AndroidExpoViewComponentDescriptor.h"

namespace react = facebook::react;

namespace expo {

ExpoViewComponentRegistry &getExpoViewComponentRegistry() {
  static ExpoViewComponentRegistry registry;
  return registry;
}

react::ComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
) {
  auto descriptor = std::make_unique<AndroidExpoViewComponentDescriptor>(
    parameters,
    react::RawPropsParser(/*useRawPropsJsiValue=*/true)
  );

  auto flavor = std::static_pointer_cast<std::string const>(parameters.flavor);
  if (auto registration = getExpoViewComponentRegistry().find(*flavor)) {
    descriptor->setComponentRegistration(std::move(registration));
  }

  return descriptor;
}

} // namespace expo
