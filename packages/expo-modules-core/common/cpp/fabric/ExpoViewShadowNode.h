// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/graphics/rounding.h>

#include <algorithm>
#include <cmath>

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

  // Only `RNHostView` declares `expoInternalSizeFromChildren` so it is used to gate the layout overrides.
  static bool sizesToContent(const react::Props::Shared &props) {
    auto const *viewProps = dynamic_cast<const ExpoViewProps *>(props.get());

    if (viewProps == nullptr) {
      return false;
    }

    auto const it = viewProps->propsMap.find("expoInternalSizeFromChildren");
    return it != viewProps->propsMap.end() && it->second.isBool() && it->second.getBool();
  }

  react::Size measureContent(
    const react::LayoutContext &layoutContext,
    const react::LayoutConstraints &layoutConstraints
  ) const override {
    if (!sizesToContent(this->getProps())) {
      return ConcreteViewShadowNode::measureContent(layoutContext, layoutConstraints);
    }

    auto const *content = hostedContent();

    if (content == nullptr) {
      return {};
    }

    auto size = content->measure(layoutContext, hostedContentConstraints(*content));

    // Round up to the next value on the pixel grid, so the frame this node reports is never a
    // fraction of a pixel smaller than the content laid out inside it. `ParagraphShadowNode` biases
    // the same way for the views it embeds in a text run.
    size.width += 0.01f;
    size.height += 0.01f;

    return react::roundToPixel<&std::ceil>(size, layoutContext.pointScaleFactor);
  }

  void layout(react::LayoutContext layoutContext) override {
    ConcreteViewShadowNode::layout(layoutContext);

    if (!sizesToContent(this->getProps())) {
      return;
    }

    auto const *content = hostedContent();

    if (content == nullptr) {
      return;
    }

    // The same constraints the content was measured with, deliberately not the frame Yoga settled
    // on. Laying it out at that frame would put the parent back in charge of the content's layout,
    // which is the dependency this whole path exists to remove.
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
  /**
   The single element this view hosts, or nothing when nothing is mounted yet - a hosted RN `Modal`
   renders null until it is visible.

   Only the first child is measured and laid out, and `RNHostView` takes one element for that reason.
   A leaf's children are outside the Yoga tree, so arranging several would mean reimplementing flex
   here: the default is a column with `alignItems: stretch`, and a caller's own `flexDirection`, gaps
   and child margins are all invisible from this side. A caller that needs several gives them one
   React Native parent, which Yoga arranges properly.
   */
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
