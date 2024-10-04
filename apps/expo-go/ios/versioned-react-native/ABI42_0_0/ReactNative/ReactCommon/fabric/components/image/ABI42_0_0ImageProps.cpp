/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI42_0_0React/components/image/ImageProps.h>
#include <ABI42_0_0React/components/image/conversions.h>
#include <ABI42_0_0React/core/propsConversions.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

ImageProps::ImageProps(const ImageProps &sourceProps, const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      sources(convertRawProp(rawProps, "source", sourceProps.sources, {})),
      defaultSources(convertRawProp(
          rawProps,
          "defaultSource",
          sourceProps.defaultSources,
          {})),
      resizeMode(convertRawProp(
          rawProps,
          "resizeMode",
          sourceProps.resizeMode,
          ImageResizeMode::Stretch)),
      blurRadius(
          convertRawProp(rawProps, "blurRadius", sourceProps.blurRadius, {})),
      capInsets(
          convertRawProp(rawProps, "capInsets", sourceProps.capInsets, {})),
      tintColor(
          convertRawProp(rawProps, "tintColor", sourceProps.tintColor, {})) {}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
