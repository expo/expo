// Copyright 2026-present 650 Industries. All rights reserved.

#include "NewComponentDescriptor.h"
#include "RawPropsAccess.h"

#include <algorithm>
#include <stdexcept>
#include <utility>
#include <vector>

#include <folly/dynamic.h>
#include <react/renderer/core/PropsMacros.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo::views {

#if REACT_NATIVE_TARGET_VERSION >= 87
namespace {

/**
 Sets a prop of the base view props. `setProp` knows `shouldRasterize` only by its JavaScript name, while
 the props constructor also reads the iOS name, so the iOS name goes to `setProp` as `shouldRasterize`.
 */
void setBaseViewProp(
  NewViewProps &props,
  const react::PropsParserContext &context,
  react::RawPropsPropNameHash hash,
  const char *name,
  const react::RawValue &value
) {
  static const auto shouldRasterizeIOSHash = RAW_PROPS_KEY_HASH("shouldRasterizeIOS");
  static const auto shouldRasterizeHash = RAW_PROPS_KEY_HASH("shouldRasterize");

  if (hash == shouldRasterizeIOSHash && std::string_view(name) == "shouldRasterizeIOS") {
    props.react::ViewProps::setProp(context, shouldRasterizeHash, "shouldRasterize", value);
    return;
  }
  props.react::ViewProps::setProp(context, hash, name, value);
}

} // namespace
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

  propNames_ = componentFlavor().decoder->propNames();
  propIndexes_.reserve(propNames_.size());
  for (size_t index = 0; index < propNames_.size(); index++) {
    propIndexes_.emplace_back(RAW_PROPS_KEY_HASH(propNames_[index]), index);
  }
  std::sort(propIndexes_.begin(), propIndexes_.end());
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

#if REACT_NATIVE_TARGET_VERSION >= 87
  // Copies the source props, as React Native's iterator setter does. Before React Native 0.87, the base
  // view props can't be copied, so the props are parsed twice: the decoder reads the whole props object,
  // and `RawPropsParser` parses it for the base view props.
  auto newProps = std::make_shared<NewViewProps>(sourceProps);
  const auto &decoder = *componentFlavor().decoder;

  if (const auto jsiProps = jsiRawProps(rawProps)) {
    auto &runtime = jsiProps->runtime;
    auto object = jsiProps->value.asObject(runtime);
    auto names = object.getPropertyNames(runtime);
    const auto count = names.size(runtime);

    // The values of the view's props, each with its index in `propNames_`.
    std::vector<std::pair<size_t, jsi::Value>> values;

    for (size_t i = 0; i < count; i++) {
      auto nameString = names.getValueAtIndex(runtime, i).getString(runtime);
      auto value = object.getProperty(runtime, nameString);
      const auto name = nameString.utf8(runtime);
      const auto hash = RAW_PROPS_KEY_HASH(name);

      // Every prop goes to the base view props, the view's props too: a view prop with the name of a base
      // view prop, such as `opacity`, sets both.
      setBaseViewProp(*newProps, context, hash, name.c_str(), react::RawValue(runtime, value));

      if (const auto index = propIndex(hash, name)) {
        values.emplace_back(*index, std::move(value));
      }
    }
    // Without values of the view's props, the copy keeps the decoded props of `sourceProps`.
    if (!values.empty()) {
      newProps->decodedProps = decoder.decodeValues(runtime, values, sourceProps.decodedProps);
    }
    return newProps;
  }

  // Props without a runtime come as `folly::dynamic`.
  // TODO: Decode the view's props too, without converting `folly::dynamic` values.
  const auto dynamicProps = static_cast<folly::dynamic>(rawProps);
  std::vector<std::string_view> skippedNames;

  for (const auto &[key, value] : dynamicProps.items()) {
    const auto &name = key.getString();
    const auto hash = RAW_PROPS_KEY_HASH(name);

    setBaseViewProp(*newProps, context, hash, name.c_str(), react::RawValue(value));

    if (const auto index = propIndex(hash, name)) {
      skippedNames.emplace_back(propNames_[*index]);
    }
  }
  if (!skippedNames.empty()) {
    decoder.didSkipProps(skippedNames);
  }
  return newProps;
#else
  auto decodedProps = decodeProps(rawProps, sourceProps.decodedProps);

  rawProps.parse(rawPropsParser_);
  return std::make_shared<const NewViewProps>(context, sourceProps, rawProps, std::move(decodedProps));
#endif
}

const NewComponentFlavor &NewComponentDescriptor::componentFlavor() const {
  return *std::static_pointer_cast<const NewComponentFlavor>(flavor_);
}

#if REACT_NATIVE_TARGET_VERSION < 87
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
#endif

std::optional<size_t> NewComponentDescriptor::propIndex(react::RawPropsPropNameHash hash, std::string_view name) const {
  auto entry = std::lower_bound(
    propIndexes_.begin(),
    propIndexes_.end(),
    hash,
    [](const auto &entry, react::RawPropsPropNameHash hash) { return entry.first < hash; }
  );
  // Names with the same hash are next to each other. Comparing the names rules out a key that only has
  // the hash of a view's prop.
  for (; entry != propIndexes_.end() && entry->first == hash; ++entry) {
    if (propNames_[entry->second] == name) {
      return entry->second;
    }
  }
  return std::nullopt;
}

} // namespace expo::views
