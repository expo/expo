/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Color.h>
#include <ABI48_0_0React/ABI48_0_0renderer/imagemanager/primitives.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

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

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
