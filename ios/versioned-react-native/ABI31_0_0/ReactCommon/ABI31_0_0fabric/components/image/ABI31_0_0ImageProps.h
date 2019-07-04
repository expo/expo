/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI31_0_0fabric/ABI31_0_0components/view/ViewProps.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Color.h>
#include <ABI31_0_0fabric/ABI31_0_0imagemanager/primitives.h>

namespace facebook {
namespace ReactABI31_0_0 {

// TODO (T28334063): Consider for codegen.
class ImageProps final:
  public ViewProps {

public:
  ImageProps() = default;
  ImageProps(const ImageProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const ImageSources sources {};
  const ImageSources defaultSources {};
  const ImageResizeMode resizeMode {ImageResizeMode::Stretch};
  const Float blurRadius {};
  const EdgeInsets capInsets {};
  const SharedColor tintColor {};
};

} // namespace ReactABI31_0_0
} // namespace facebook
