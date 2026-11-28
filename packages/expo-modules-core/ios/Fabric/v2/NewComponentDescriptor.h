// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/RawPropsPrimitives.h>

#include "NewPropsDecoder.h"
#include "NewViewShadowNode.h"

namespace expo::views {

/**
 What tells the descriptors of different view types apart: the component name, the props decoder, and whether Fabric
 keeps the direct children of the views.
 Fabric uses `name.c_str()` as the component handle. For a short name, that buffer is inside the flavor
 object itself, so the flavor must stay alive at the same address, and `name` must not change, for as
 long as views of its type can exist, also across reloads.
 */
struct NewComponentFlavor {
  std::string name;
  std::shared_ptr<const NewPropsDecoder> decoder;
  /**
   Stops Fabric from flattening the direct children of the views, as `collapsableChildren={false}` does. The SwiftUI
   views need it, because each direct child is an element of their `children`.
   */
  bool keepsDirectChildren = false;
  /**
   Another layout system places the views, not Yoga, so their layout origin isn't where they are drawn. `measure()` of a
   descendant skips that origin, as when a view publishes a zero content origin to `ContentOriginRegistry`.
   */
  bool hasZeroContentOrigin = false;
};

/**
 The component descriptor of the views of Expo Modules v2, one instance for each view type.
 Since React Native 0.87, `cloneProps` walks the props of an update once: each prop goes to the base view
 props with `setProp`, and the values of the view's own props go to the decoder in one call.
 */
class NewComponentDescriptor final : public facebook::react::ConcreteComponentDescriptor<NewViewShadowNode> {
public:
  explicit NewComponentDescriptor(const facebook::react::ComponentDescriptorParameters &parameters);

  /**
   Returns the provider that registers a descriptor for the view type of the given flavor.
   */
  static facebook::react::ComponentDescriptorProvider provider(std::shared_ptr<const NewComponentFlavor> flavor);

  facebook::react::ComponentHandle getComponentHandle() const override;

  facebook::react::ComponentName getComponentName() const override;

  facebook::react::ShadowNodeTraits getTraits() const override;

  facebook::react::Props::Shared cloneProps(
    const facebook::react::PropsParserContext &context,
    const facebook::react::Props::Shared &props,
    facebook::react::RawProps rawProps
  ) const override;

  const NewComponentFlavor &componentFlavor() const;

private:
#if REACT_NATIVE_TARGET_VERSION < 87
  DecodedProps decodeProps(const facebook::react::RawProps &rawProps, const DecodedProps &previous) const;
#endif

  /**
   Returns the index of the view's prop with the given name and hash (`RAW_PROPS_KEY_HASH`), or
   `std::nullopt` when the name isn't one of the view's props.
   */
  std::optional<size_t> propIndex(facebook::react::RawPropsPropNameHash hash, std::string_view name) const;

  /**
   Builds `propNames_` and `propIndexes_` from the decoder. It runs on the first `propIndex` call, not in the
   constructor, because getting the names creates the decoder, and React Native constructs a descriptor for
   every registered view type, also for the types that the app never renders.
   */
  void buildPropIndexes() const;

  mutable std::once_flag propIndexesOnce_;

  /**
   The names of the view's props, in the order of the decoder's `propNames`.
   */
  mutable std::vector<std::string> propNames_;

  /**
   The hash of each name in `propNames_` with its index, sorted by the hash.
   */
  mutable std::vector<std::pair<facebook::react::RawPropsPropNameHash, size_t>> propIndexes_;
};

} // namespace expo::views

#endif // __cplusplus
