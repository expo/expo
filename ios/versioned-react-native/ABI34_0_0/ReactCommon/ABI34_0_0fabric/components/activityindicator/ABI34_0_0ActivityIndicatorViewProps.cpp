/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactABI34_0_0/components/activityindicator/ActivityIndicatorViewProps.h>
#include <ReactABI34_0_0/components/activityindicator/conversions.h>
#include <ReactABI34_0_0/core/propsConversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

ActivityIndicatorViewProps::ActivityIndicatorViewProps(
    const ActivityIndicatorViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      animating(convertRawProp(rawProps, "animating", sourceProps.animating)),
      color(convertRawProp(rawProps, "color", sourceProps.color)),
      hidesWhenStopped(convertRawProp(
          rawProps,
          "hidesWhenStopped",
          sourceProps.hidesWhenStopped)),
      size(convertRawProp(rawProps, "size", sourceProps.size)) {}

} // namespace ReactABI34_0_0
} // namespace facebook
