// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/core/ShadowNodeTraits.h>

#include <string>

namespace expo {

/**
 Per-component shadow-node traits for Expo module views.

 Every Expo view shares one shadow node class (`ExpoViewShadowNode`), with the
 component name carried by the descriptor's flavor — so a view cannot declare
 traits through `BaseTraits()`, which is per-class. This registry keys the
 declaration by component name instead, and `ExpoViewShadowNode::initialize`
 applies it to each instance.

 The motivating use is React DOM elements: an `<img>` backed by expo-image is an
 inline *replaced* element, which react-native's layout recognizes by the
 `InlineText` + `InlineReplaced` traits rather than by any component name. A
 module view that declares those traits flows inside a line of text like the
 intrinsic `<img>` — and the same goes for any future replaced element
 (expo-video, a form control) without further changes here.

 Declare before the first render of the view — e.g. at module registration, or
 from a library's load-time initializer. Redeclaring a name overwrites it.
 */
class ExpoViewTraits {
public:
  static void declare(const std::string &componentName, facebook::react::ShadowNodeTraits traits);

  /**
   The traits declared for `componentName`, or empty traits if none were.
   */
  static facebook::react::ShadowNodeTraits declaredFor(const std::string &componentName);
};

} // namespace expo

#endif // __cplusplus
