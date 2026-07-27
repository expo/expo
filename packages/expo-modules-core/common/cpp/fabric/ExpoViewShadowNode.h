// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

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

private:
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
