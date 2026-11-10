// Copyright 2026-present 650 Industries. All rights reserved.

#include "NewComponentDescriptor.h"
#include "RawPropsAccess.h"

#include <stdexcept>
#include <utility>
#include <vector>

#include <folly/dynamic.h>

namespace react = facebook::react;

namespace expo::views {

#if REACT_NATIVE_TARGET_VERSION >= 87
// `cloneProps` parses the base view props with `RawPropsParser`. If `NewViewProps` had its own `setProp`,
// `ConcreteComponentDescriptor` would skip preparing that parser under `enableCppPropsIteratorSetter`.
static_assert(!react::HasIteratorSetterCtor<NewViewProps>, "NewViewProps must not opt into the iterator setter");
#endif

NewComponentDescriptor::NewComponentDescriptor(const react::ComponentDescriptorParameters &parameters)
  : ConcreteComponentDescriptor(parameters) {
  // `react_native_assert` does nothing in release builds, where a missing flavor would crash later on a
  // null pointer, so this checks it in every build.
  if (flavor_ == nullptr) {
    throw std::invalid_argument("expo::views::NewComponentDescriptor requires a NewComponentFlavor");
  }
  if (componentFlavor().decoder == nullptr) {
    throw std::invalid_argument("expo::views::NewComponentFlavor requires a decoder");
  }
}

react::ComponentDescriptorProvider NewComponentDescriptor::provider(std::shared_ptr<const NewComponentFlavor> flavor) {
  const char *name = flavor->name.c_str();

  return react::ComponentDescriptorProvider{
    .handle = reinterpret_cast<react::ComponentHandle>(name),
    .name = name,
    .flavor = std::move(flavor),
    .constructor = &react::concreteComponentDescriptorConstructor<NewComponentDescriptor>,
  };
}

react::ComponentHandle NewComponentDescriptor::getComponentHandle() const {
  return reinterpret_cast<react::ComponentHandle>(getComponentName());
}

react::ComponentName NewComponentDescriptor::getComponentName() const {
  return componentFlavor().name.c_str();
}

react::Props::Shared NewComponentDescriptor::cloneProps(
  const react::PropsParserContext &context,
  const react::Props::Shared &props,
  react::RawProps rawProps
) const {
  // A node created without props shares the default props, as in `ConcreteComponentDescriptor`.
  if (!props && rawProps.isEmpty()) {
    return NewViewShadowNode::defaultSharedProps();
  }

  const auto &sourceProps = props
    ? static_cast<const NewViewProps &>(*props)
    : *NewViewShadowNode::defaultSharedProps();
  auto decodedProps = decodeProps(rawProps, sourceProps.decodedProps);

  rawProps.parse(rawPropsParser_);
  return std::make_shared<const NewViewProps>(context, sourceProps, rawProps, std::move(decodedProps));
}

const NewComponentFlavor &NewComponentDescriptor::componentFlavor() const {
  return *std::static_pointer_cast<const NewComponentFlavor>(flavor_);
}

DecodedProps NewComponentDescriptor::decodeProps(const react::RawProps &rawProps, const DecodedProps &previous) const {
  if (rawProps.isEmpty()) {
    return previous;
  }

  const auto &decoder = *componentFlavor().decoder;

  if (const auto jsiProps = jsiRawProps(rawProps)) {
    return decoder.decode(jsiProps->runtime, jsiProps->value, previous);
  }

  // TODO: Decode these props too, without converting `folly::dynamic` values.
  const auto dynamicProps = static_cast<folly::dynamic>(rawProps);
  std::vector<std::string_view> propNames;
  propNames.reserve(dynamicProps.size());
  for (const auto &key : dynamicProps.keys()) {
    propNames.emplace_back(key.getString());
  }
  decoder.didSkipProps(propNames);
  return previous;
}

} // namespace expo::views
