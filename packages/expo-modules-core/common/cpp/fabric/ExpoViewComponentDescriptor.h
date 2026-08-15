// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ShadowNode.h>

#include "ExpoViewShadowNode.h"

namespace expo {

template<typename ShadowNodeType = ExpoViewShadowNode<ExpoViewProps, ExpoViewState>>
class ExpoViewComponentDescriptor
  : public facebook::react::ConcreteComponentDescriptor<ShadowNodeType> {
public:
  using Flavor = std::shared_ptr<std::string const>;

  ExpoViewComponentDescriptor(
    facebook::react::ComponentDescriptorParameters const &parameters,
    react::RawPropsParser &&rawPropsParser = {}
  ) : facebook::react::ConcreteComponentDescriptor<ShadowNodeType>(parameters, std::move(rawPropsParser)) {}

  facebook::react::ComponentHandle getComponentHandle() const override {
    return reinterpret_cast<facebook::react::ComponentHandle>(getComponentName());
  }

  facebook::react::ComponentName getComponentName() const override {
    return std::static_pointer_cast<std::string const>(this->flavor_)->c_str();
  }

  void adopt(facebook::react::ShadowNode &shadowNode) const override {
    react_native_assert(dynamic_cast<ShadowNodeType *>(&shadowNode));

    const auto snode = dynamic_cast<ShadowNodeType *>(&shadowNode);
    const auto state = snode->getStateData();

    auto width = state._width;
    auto height = state._height;

    if (!isnan(width) || !isnan(height)) {
      auto const &props = *std::static_pointer_cast<const facebook::react::ViewProps>(
        snode->getProps());

      // The node has width and/or height set as style props, so we should not override it
      auto widthProp = props.yogaStyle.dimension(facebook::yoga::Dimension::Width);
      auto heightProp = props.yogaStyle.dimension(facebook::yoga::Dimension::Height);

      if (widthProp.value().isDefined()) {
        // view has fixed dimension size set in props, so we should not autosize it in that axis
        width = widthProp.value().unwrap();
      }
      if (heightProp.value().isDefined()) {
        height = heightProp.value().unwrap();
      }

      snode->setSize({width, height});
    }

    // handle layout style prop update
    auto styleWidth = state._styleWidth;
    auto styleHeight = state._styleHeight;

    if (!isnan(styleWidth) || !isnan(styleHeight)) {
      auto const &props = *std::static_pointer_cast<const facebook::react::ViewProps>(
        snode->getProps());

      auto &style = const_cast<facebook::yoga::Style &>(props.yogaStyle);
      bool changedStyle = false;

      if (!isnan(styleWidth)) {
        style.setDimension(facebook::yoga::Dimension::Width,
                           facebook::yoga::StyleSizeLength::points(styleWidth));
        changedStyle = true;
      }

      if (!isnan(styleHeight)) {
        style.setDimension(facebook::yoga::Dimension::Height,
                           facebook::yoga::StyleSizeLength::points(styleHeight));
        changedStyle = true;
      }

      // Update yoga props and dirty layout if we changed the style
      if (changedStyle) {
        snode->updateYogaProps();
        snode->dirtyLayout();
      }
    }
    facebook::react::ConcreteComponentDescriptor<ShadowNodeType>::adopt(shadowNode);
  }
};

} // namespace expo

#endif // __cplusplus
