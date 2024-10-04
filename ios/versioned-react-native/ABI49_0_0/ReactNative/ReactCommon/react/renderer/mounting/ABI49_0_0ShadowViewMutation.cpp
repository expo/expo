/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ShadowViewMutation.h"

#include <utility>

namespace ABI49_0_0facebook::ABI49_0_0React {

/**
 * Initialize static feature flags for this module.
 * These flags should be treated as temporary.
 */
bool ShadowViewMutation::PlatformSupportsRemoveDeleteTreeInstruction = false;

ShadowViewMutation ShadowViewMutation::CreateMutation(ShadowView shadowView) {
  return {
      /* .type = */ Create,
      /* .parentShadowView = */ {},
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ std::move(shadowView),
      /* .index = */ -1,
  };
}

ShadowViewMutation ShadowViewMutation::DeleteMutation(
    ShadowView shadowView,
    bool isRedundantOperation) {
  return {
      /* .type = */ Delete,
      /* .parentShadowView = */ {},
      /* .oldChildShadowView = */ std::move(shadowView),
      /* .newChildShadowView = */ {},
      /* .index = */ -1,
      /* .isRedundantOperation */ isRedundantOperation,
  };
}

ShadowViewMutation ShadowViewMutation::InsertMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ Insert,
      /* .parentShadowView = */ std::move(parentShadowView),
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ std::move(childShadowView),
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::RemoveMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index,
    bool isRedundantOperation) {
  return {
      /* .type = */ Remove,
      /* .parentShadowView = */ std::move(parentShadowView),
      /* .oldChildShadowView = */ std::move(childShadowView),
      /* .newChildShadowView = */ {},
      /* .index = */ index,
      /* .isRedundantOperation */ isRedundantOperation,
  };
}

ShadowViewMutation ShadowViewMutation::RemoveDeleteTreeMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ RemoveDeleteTree,
      /* .parentShadowView = */ std::move(parentShadowView),
      /* .oldChildShadowView = */ std::move(childShadowView),
      /* .newChildShadowView = */ {},
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::UpdateMutation(
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    ShadowView parentShadowView) {
  return {
      /* .type = */ Update,
      /* .parentShadowView = */ std::move(parentShadowView),
      /* .oldChildShadowView = */ std::move(oldChildShadowView),
      /* .newChildShadowView = */ std::move(newChildShadowView),
      /* .index = */ -1,
  };
}

bool ShadowViewMutation::mutatedViewIsVirtual() const {
  bool viewIsVirtual = false;

#ifdef ANDROID
  // Explanation: Even for non-virtual views,
  //              for "Insert" mutations, oldChildShadowView is always empty.
  //              for "Remove" mutations, newChildShadowView is always empty.
  // Thus, to see if a view is virtual, we need to always check both the old and
  // new View.
  viewIsVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
      oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;
#endif

  return viewIsVirtual;
}

ShadowViewMutation::ShadowViewMutation(
    Type type,
    ShadowView parentShadowView,
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    int index,
    bool isRedundantOperation)
    : type(type),
      parentShadowView(std::move(parentShadowView)),
      oldChildShadowView(std::move(oldChildShadowView)),
      newChildShadowView(std::move(newChildShadowView)),
      index(index),
      isRedundantOperation(isRedundantOperation) {}

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowViewMutation const &mutation) {
  switch (mutation.type) {
    case ShadowViewMutation::Create:
      return "Create";
    case ShadowViewMutation::Delete:
      return "Delete";
    case ShadowViewMutation::Insert:
      return "Insert";
    case ShadowViewMutation::Remove:
      return "Remove";
    case ShadowViewMutation::Update:
      return "Update";
    case ShadowViewMutation::RemoveDeleteTree:
      return "RemoveDeleteTree";
  }
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowViewMutation const &mutation,
    DebugStringConvertibleOptions options) {
  return {
      mutation.oldChildShadowView.componentHandle != 0
          ? DebugStringConvertibleObject{"oldChild",
                                         getDebugDescription(
                                             mutation.oldChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.newChildShadowView.componentHandle != 0
          ? DebugStringConvertibleObject{"newChild",
                                         getDebugDescription(
                                             mutation.newChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.parentShadowView.componentHandle != 0
          ? DebugStringConvertibleObject{"parent",
                                         getDebugDescription(
                                             mutation.parentShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.index != -1
          ? DebugStringConvertibleObject{"index",
                                         getDebugDescription(
                                             mutation.index, options)}
          : DebugStringConvertibleObject{},
  };
}

#endif

} // namespace ABI49_0_0facebook::ABI49_0_0React
