// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/LayoutableShadowNode.h>

#include <cmath>
#include <optional>

#include "ExpoViewEventEmitter.h"
#include "ExpoViewProps.h"
#include "ExpoViewState.h"

namespace expo {

extern const char ExpoViewComponentName[];

/**
 Measuring content lays out a clone of the subtree, and that clones each descendant in place. If one
 of those descendants is itself a content-sized view it must not start its own measurement: the
 answer would not change and the work multiplies with every level of nesting.
 */
inline thread_local int contentMeasurementDepth = 0;

struct ContentMeasurementScope {
  ContentMeasurementScope() noexcept {
    contentMeasurementDepth++;
  }

  ~ContentMeasurementScope() noexcept {
    contentMeasurementDepth--;
  }
};

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
   A view that sets `sizeFromChildren` takes its size from its children, but Yoga can only offer the
   children the space this node was itself granted. As soon as anything sits between the two - the
   padding on a SwiftUI `VStack`, the border the Button Shapes accessibility setting draws around a
   `Menu` label - the two definitions are circular and every layout pass asks for more than the last.

   Measuring the child on its own breaks that. `LayoutConstraints` defaults to an infinite maximum,
   which reaches Yoga as an undefined available size, and Yoga sizes a node with no available space
   to its content: `flex` children get no free space to grow into, and percentages resolve to `auto`.
   The result mentions this node nowhere, so writing it back cannot feed anything.

   This is the primitive React Native uses to size views embedded in text, see
   `ParagraphShadowNode::measureContent`. `measure()` lays out a clone, and `configureYogaTree`
   clones each descendant in place as it goes, so the live tree is left alone. It also clears
   `affectedNodes`, so the speculative pass emits no `onLayout` events.
   */
  void sizeToContentIfNeeded() noexcept {
    if (contentMeasurementDepth > 0) {
      return;
    }

    auto const &viewProps = static_cast<const ExpoViewProps &>(*this->props_);
    auto const it = viewProps.propsMap.find("sizeFromChildren");

    if (it == viewProps.propsMap.end() || !it->second.isBool() || !it->second.getBool()) {
      return;
    }

    // With nothing measurable to size to we have no opinion, so any size measured earlier has to go:
    // a child that was removed must not leave this node pinned to the size it used to have.
    auto const contentSize = measureContentSize();

    auto const width = contentSize
      ? facebook::yoga::StyleSizeLength::points(contentSize->width)
      : facebook::yoga::StyleSizeLength::undefined();
    auto const height = contentSize
      ? facebook::yoga::StyleSizeLength::points(contentSize->height)
      : facebook::yoga::StyleSizeLength::undefined();

    // Not `||`, which would short-circuit and leave the height alone whenever the width changed.
    bool const changedWidth = applyDimension(facebook::yoga::Dimension::Width, width);
    bool const changedHeight = applyDimension(facebook::yoga::Dimension::Height, height);

    if (changedWidth || changedHeight) {
      this->updateYogaProps();
      this->dirtyLayout();
    }
  }

  // `adopt()` only runs on create and clone, and the initial mount appends children by mutation
  // afterwards, so the size has to be recomputed when the child list changes too.
  void appendChild(const std::shared_ptr<const facebook::react::ShadowNode> &child) override {
    ConcreteViewShadowNode::appendChild(child);
    sizeToContentIfNeeded();
  }

private:
  /**
   The size the first child reports when offered unlimited room, or nothing when there is no child to
   ask - including on creation, before children have been appended.
   */
  std::optional<react::Size> measureContentSize() noexcept {
    auto const &children = this->getChildren();

    if (children.empty()) {
      return std::nullopt;
    }

    auto const *child = dynamic_cast<const react::LayoutableShadowNode *>(children.front().get());

    if (child == nullptr) {
      return std::nullopt;
    }

    react::LayoutContext layoutContext{};
    auto const pointScaleFactor = this->getLayoutMetrics().pointScaleFactor;

    if (pointScaleFactor > 0) {
      layoutContext.pointScaleFactor = pointScaleFactor;
    }

    // `LayoutConstraints` defaults to a zero minimum and an infinite maximum, which reaches Yoga as
    // an undefined available size, i.e. a max-content measurement.
    react::LayoutConstraints constraints{};

    // `layoutTree` applies the constraints by writing them as the measured node's own min and max
    // dimension styles, which overwrites whatever the child declared. Seeding them from the child's
    // own values makes that write a no-op, so a `minHeight` or `maxWidth` on the hosted view still
    // applies. Percentages need a reference length to resolve, so those stay unconstrained.
    if (auto const *childViewProps =
          dynamic_cast<const react::ViewProps *>(children.front()->getProps().get())) {
      auto const &childStyle = childViewProps->yogaStyle;

      constrainToPoints(childStyle.minDimension(facebook::yoga::Dimension::Width),
                        constraints.minimumSize.width);
      constrainToPoints(childStyle.minDimension(facebook::yoga::Dimension::Height),
                        constraints.minimumSize.height);
      constrainToPoints(childStyle.maxDimension(facebook::yoga::Dimension::Width),
                        constraints.maximumSize.width);
      constrainToPoints(childStyle.maxDimension(facebook::yoga::Dimension::Height),
                        constraints.maximumSize.height);
    }

    react::Size contentSize;

    {
      ContentMeasurementScope scope;
      contentSize = child->measure(layoutContext, constraints);
    }

    if (std::isnan(contentSize.width) || std::isnan(contentSize.height)) {
      return std::nullopt;
    }

    return contentSize;
  }

  /**
   Copies a point-valued length into a layout constraint, leaving the constraint alone for `auto`,
   percentages and anything else Yoga cannot resolve without a reference length.
   */
  static void constrainToPoints(
    facebook::yoga::StyleSizeLength length,
    react::Float &constraint
  ) noexcept {
    if (length.isPoints() && length.value().isDefined() && length.value().unwrap() >= 0) {
      constraint = length.value().unwrap();
    }
  }

  /**
   Writes a dimension and reports whether it changed anything. Props are shared between clones, so the
   style may already carry a size written while adopting a different clone. This node's own Yoga node
   is the only per-clone record of what it was actually laid out with, so that is what decides.
   */
  bool applyDimension(
    facebook::yoga::Dimension dimension,
    facebook::yoga::StyleSizeLength length
  ) noexcept {
    if (this->yogaNode_.style().dimension(dimension).inexactEquals(length)) {
      return false;
    }

    auto &style = const_cast<facebook::yoga::Style &>(
      static_cast<const react::ViewProps &>(*this->props_).yogaStyle);

    style.setDimension(dimension, length);
    return true;
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
