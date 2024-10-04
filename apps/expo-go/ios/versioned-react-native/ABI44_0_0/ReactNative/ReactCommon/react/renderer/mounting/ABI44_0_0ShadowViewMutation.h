/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <ABI44_0_0React/ABI44_0_0renderer/mounting/ShadowView.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

/*
 * Describes a single native view tree mutation which may contain
 * pointers to an old shadow view, a new shadow view, a parent shadow view and
 * final index of inserted or updated view.
 * Use static methods to instantiate mutations of different types.
 */
struct ShadowViewMutation final {
  using List = std::vector<ShadowViewMutation>;

#pragma mark - Designated Initializers

  /*
   * Creates and returns an `Create` mutation.
   */
  static ShadowViewMutation CreateMutation(ShadowView shadowView);

  /*
   * Creates and returns an `Delete` mutation.
   */
  static ShadowViewMutation DeleteMutation(ShadowView shadowView);

  /*
   * Creates and returns an `Insert` mutation.
   */
  static ShadowViewMutation InsertMutation(
      ShadowView parentShadowView,
      ShadowView childShadowView,
      int index);

  /*
   * Creates and returns a `Remove` mutation.
   */
  static ShadowViewMutation RemoveMutation(
      ShadowView parentShadowView,
      ShadowView childShadowView,
      int index);

  /*
   * Creates and returns an `Update` mutation.
   */
  static ShadowViewMutation UpdateMutation(
      ShadowView parentShadowView,
      ShadowView oldChildShadowView,
      ShadowView newChildShadowView,
      int index);

#pragma mark - Type

  enum Type { Create = 1, Delete = 2, Insert = 4, Remove = 8, Update = 16 };

#pragma mark - Fields

  Type type = {Create};
  ShadowView parentShadowView = {};
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = {};
};

using ShadowViewMutationList = std::vector<ShadowViewMutation>;

#if ABI44_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowViewMutation const &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowViewMutation const &object,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
