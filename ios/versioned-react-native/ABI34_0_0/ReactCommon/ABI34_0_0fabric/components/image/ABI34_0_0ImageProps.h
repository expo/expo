/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactABI34_0_0/components/view/ViewProps.h>
#include <ReactABI34_0_0/graphics/Color.h>
#include <ReactABI34_0_0/imagemanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

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

} // namespace ReactABI34_0_0
} // namespace facebook
