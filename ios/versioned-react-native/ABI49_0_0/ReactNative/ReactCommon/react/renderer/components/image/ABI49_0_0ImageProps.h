/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0primitives.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

// TODO (T28334063): Consider for codegen.
class ImageProps final : public ViewProps {
 public:
  ImageProps() = default;
  ImageProps(
      const PropsParserContext &context,
      const ImageProps &sourceProps,
      const RawProps &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#pragma mark - Props

  ImageSources sources{};
  ImageSources defaultSources{};
  ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  Float blurRadius{};
  EdgeInsets capInsets{};
  SharedColor tintColor{};
  std::string internal_analyticTag{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
