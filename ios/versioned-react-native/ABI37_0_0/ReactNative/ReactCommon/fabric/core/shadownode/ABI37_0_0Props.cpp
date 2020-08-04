/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0Props.h"

#include <folly/dynamic.h>
#include <ABI37_0_0React/core/propsConversions.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

Props::Props(const Props &sourceProps, const RawProps &rawProps)
    : nativeId(convertRawProp(rawProps, "nativeID", sourceProps.nativeId)),
      revision(sourceProps.revision + 1)
#ifdef ANDROID
      ,
      rawProps((folly::dynamic)rawProps)
#endif
          {};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
