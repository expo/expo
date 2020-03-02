/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI37_0_0React/components/view/ViewProps.h>
#include <ABI37_0_0React/graphics/Color.h>
#include <ABI37_0_0React/imagemanager/primitives.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

// TODO (T28334063): Consider for codegen.
class ImageProps final : public ViewProps {
 public:
  ImageProps() = default;
  ImageProps(const ImageProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const ImageSources sources{};
  const ImageSources defaultSources{};
  const ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  const Float blurRadius{};
  const EdgeInsets capInsets{};
  const SharedColor tintColor{};
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
