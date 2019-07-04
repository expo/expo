/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI31_0_0fabric/ABI31_0_0components/activityindicator/ActivityIndicatorViewProps.h>
#include <ABI31_0_0fabric/ABI31_0_0components/activityindicator/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

ActivityIndicatorViewProps::ActivityIndicatorViewProps(const ActivityIndicatorViewProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  animating(convertRawProp(rawProps, "animating", sourceProps.animating)),
  color(convertRawProp(rawProps, "color", sourceProps.color)),
  hidesWhenStopped(convertRawProp(rawProps, "hidesWhenStopped", sourceProps.hidesWhenStopped)),
  size(convertRawProp(rawProps, "size", sourceProps.size)) {}

} // namespace ReactABI31_0_0
} // namespace facebook
