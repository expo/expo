// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>
#include <string>

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "NewPropsDecoder.h"
#include "NewViewShadowNode.h"

namespace expo::views {

/**
 What tells the descriptors of different view types apart: the component name and the props decoder.
 Fabric uses `name.c_str()` as the component handle. For a short name, that buffer is inside the flavor
 object itself, so the flavor must stay alive at the same address, and `name` must not change, for as
 long as views of its type can exist, also across reloads.
 */
struct NewComponentFlavor {
  std::string name;
  std::shared_ptr<const NewPropsDecoder> decoder;
};

/**
 The component descriptor of the views of Expo Modules v2, one instance for each view type.
 It decodes the view's own props in `cloneProps`, straight from the JavaScript props object.
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

  facebook::react::Props::Shared cloneProps(
    const facebook::react::PropsParserContext &context,
    const facebook::react::Props::Shared &props,
    facebook::react::RawProps rawProps
  ) const override;

private:
  const NewComponentFlavor &componentFlavor() const;

  DecodedProps decodeProps(const facebook::react::RawProps &rawProps, const DecodedProps &previous) const;
};

} // namespace expo::views

#endif // __cplusplus
