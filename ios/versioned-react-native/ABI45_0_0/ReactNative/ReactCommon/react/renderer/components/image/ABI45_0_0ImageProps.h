/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/PropsParserContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Color.h>
#include <ABI45_0_0React/ABI45_0_0renderer/imagemanager/primitives.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

// TODO (T28334063): Consider for codegen.
class ImageProps final : public ViewProps {
 public:
  ImageProps() = default;
  ImageProps(
      const PropsParserContext &context,
      const ImageProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const ImageSources sources{};
  const ImageSources defaultSources{};
  const ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  const Float blurRadius{};
  const EdgeInsets capInsets{};
  const SharedColor tintColor{};
  const std::string internal_analyticTag{};
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
