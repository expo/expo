/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0Props.h"

#include <folly/dynamic.h>
#include <ReactABI34_0_0/core/propsConversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

Props::Props(const Props &sourceProps, const RawProps &rawProps)
    : nativeId(convertRawProp(rawProps, "nativeID", sourceProps.nativeId))
#ifdef ANDROID
      ,
      rawProps((folly::dynamic)rawProps)
#endif
          {};

} // namespace ReactABI34_0_0
} // namespace facebook
