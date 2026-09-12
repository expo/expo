// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutableShadowNode.h>

#include <algorithm>

#include "ContentOriginRegistry.h"
#include "ExpoViewEventEmitter.h"
#include "ExpoViewProps.h"
#include "ExpoViewState.h"

namespace expo {

extern const char ExpoViewComponentName[];

template<typename ViewProps = ExpoViewProps, typename ViewState = ExpoViewState>
class ExpoViewShadowNode : public facebook::react::ConcreteViewShadowNode<
  ExpoViewComponentName,
  ViewProps,
  ExpoViewEventEmitter,
  ViewState
> {
public:
  typedef facebook::react::ConcreteViewShadowNode<
    ExpoViewComponentName,
    ViewProps,
    ExpoViewEventEmitter,
    ViewState
  > ConcreteViewShadowNode;

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ExpoViewShadowNode(
    const facebook::react::ShadowNodeFragment &fragment,
    const facebook::react::ShadowNodeFamily::Shared &family,
    facebook::react::ShadowNodeTraits traits
  ) : ConcreteViewShadowNode(fragment, family, traits) {
    initialize();
  }

  ExpoViewShadowNode(
    const facebook::react::ShadowNode &sourceShadowNode,
    const facebook::react::ShadowNodeFragment &fragment
  ) : ConcreteViewShadowNode(sourceShadowNode, fragment) {
    initialize();
  }

  static facebook::react::ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    return traits;
  }

  /**
   Used by `RNHostView`. Reports where this view's contents were actually drawn, for views laid
   out by SwiftUI or Compose instead of Yoga. Without it `measure()` returns this node's Yoga box,
   which is not where the hosted content ended up.
   */
  facebook::react::Point getContentOriginOffset(bool includeTransform) const override {
    // A `false` caller is asking for a scroll offset, which this view never has. Only the layout
    // path passes `true`, and that is the one this override is for.
    if (!includeTransform) {
      return ConcreteViewShadowNode::getContentOriginOffset(includeTransform);
    }

    auto contentOrigin = ContentOriginRegistry::find(this->getTag());
    if (!contentOrigin) {
      return ConcreteViewShadowNode::getContentOriginOffset(includeTransform);
    }

    // `computeRelativeLayoutMetrics` adds this node's own Yoga origin before consulting us, 
    // so subtract them as we only want content origin to be considered. 
    // Publish only the part Yoga cannot see: where
    // the native layout system placed the content inside its host.
    auto ownOrigin = this->getLayoutMetrics().frame.origin;
    return {.x = contentOrigin->x - ownOrigin.x, .y = contentOrigin->y - ownOrigin.y};
  }

  // Currently, only `RNHostView` declares `expoInternalSizeFromChildren`
  static bool sizesToContent(const react::Props::Shared &props) {
    auto const *viewProps = dynamic_cast<const ExpoViewProps *>(props.get());

    if (viewProps == nullptr) {
      return false;
    }

    auto const it = viewProps->propsMap.find("expoInternalSizeFromChildren");
    return it != viewProps->propsMap.end() && it->second.isBool() && it->second.getBool();
  }

  // Yoga calls this method for RNHostView when it has matchContents set
  react::Size measureContent(
    const react::LayoutContext &layoutContext,
    const react::LayoutConstraints &layoutConstraints
  ) const override {
    // Return default behavior when RNHostView does not have `sizesToContent` set to true
    if (!sizesToContent(this->getProps())) {
      return ConcreteViewShadowNode::measureContent(layoutContext, layoutConstraints);
    }

    auto const *content = hostedContent();

    if (content == nullptr) {
      return {};
    }

    return content->measure(layoutContext, hostedContentConstraints(*content));
  }

  // We override this so RNHostView can lay out it's children
  // We marked it as a Leaf node so we need to manually lay out the hosted content
  void layout(react::LayoutContext layoutContext) override {
    ConcreteViewShadowNode::layout(layoutContext);

    if (!sizesToContent(this->getProps())) {
      return;
    }

    auto const *content = hostedContent();

    if (content == nullptr) {
      return;
    }

    // Use the same constraint that was used to measure the content, so that the layout is consistent with the measurement
    auto const clonedContent = content->clone({});
    static_cast<react::LayoutableShadowNode &>(*clonedContent).layoutTree(
      layoutContext,
      hostedContentConstraints(*content)
    );

    this->replaceChild(*content, clonedContent, 0);

    if (layoutContext.affectedNodes != nullptr) {
      layoutContext.affectedNodes->push_back(
        static_cast<const react::LayoutableShadowNode *>(clonedContent.get()));
    }
  }

private:
  const react::LayoutableShadowNode *hostedContent() const {
    auto const &children = this->getChildren();

    return children.empty()
      ? nullptr
      : dynamic_cast<const react::LayoutableShadowNode *>(children.front().get());
  }

  react::LayoutDirection resolvedLayoutDirection() const {
    return YGNodeLayoutGetDirection(&this->yogaNode_) == YGDirectionRTL
      ? react::LayoutDirection::RightToLeft
      : react::LayoutDirection::LeftToRight;
  }

  react::LayoutConstraints hostedContentConstraints(const react::ShadowNode &content) const {
    react::LayoutConstraints constraints{};
    constraints.layoutDirection = resolvedLayoutDirection();

    auto const *contentProps = dynamic_cast<const react::ViewProps *>(content.getProps().get());

    if (contentProps == nullptr) {
      return constraints;
    }

    auto const &style = contentProps->yogaStyle;

    constrainToPoints(style.minDimension(facebook::yoga::Dimension::Width),
                      constraints.minimumSize.width);
    constrainToPoints(style.minDimension(facebook::yoga::Dimension::Height),
                      constraints.minimumSize.height);
    constrainToPoints(style.maxDimension(facebook::yoga::Dimension::Width),
                      constraints.maximumSize.width);
    constrainToPoints(style.maxDimension(facebook::yoga::Dimension::Height),
                      constraints.maximumSize.height);

    return constraints;
  }

  static void constrainToPoints(facebook::yoga::StyleSizeLength length, react::Float &constraint) {
    if (length.isPoints() && length.value().isDefined()) {
      constraint = std::max<react::Float>(0, length.value().unwrap());
    }
  }

  void initialize() noexcept {
    auto &viewProps = static_cast<const ExpoViewProps &>(*this->props_);

    if (viewProps.collapsableChildren) {
      this->traits_.set(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
    } else {
      this->traits_.unset(react::ShadowNodeTraits::Trait::ChildrenFormStackingContext);
    }

    if (YGNodeStyleGetDisplay(&this->yogaNode_) == YGDisplayContents) {
      auto it = viewProps.propsMap.find("disableForceFlatten");
      bool disableForceFlatten = (it != viewProps.propsMap.end()) && it->second.getBool();

      if (disableForceFlatten) {
        this->traits_.unset(react::ShadowNodeTraits::Trait::ForceFlattenView);
      }
    }

    {
      // Views that dispatch touch events from their own root view (e.g. RNHostView) set
      // `layoutRoot` so that `measure()` reports coordinates relative to this node instead of
      // the surface root, matching the coordinate space of the dispatched touches. The same
      // reason React Native's <Modal> shadow node sets this trait.
      auto it = viewProps.propsMap.find("layoutRoot");
      bool layoutRoot = (it != viewProps.propsMap.end()) && it->second.getBool();

      if (layoutRoot) {
        this->traits_.set(react::ShadowNodeTraits::Trait::RootNodeKind);
      } else {
        this->traits_.unset(react::ShadowNodeTraits::Trait::RootNodeKind);
      }
    }
  }
};

} // namespace expo

#endif // __cplusplus
