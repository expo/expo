/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/rncore/EventEmitters.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/rncore/Props.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/slider/SliderMeasurementsManager.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/slider/SliderState.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/imagemanager/ImageManager.h>
#include <ABI48_0_0React/ABI48_0_0renderer/imagemanager/primitives.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

extern const char SliderComponentName[];

/*
 * `ShadowNode` for <Slider> component.
 */
class SliderShadowNode final : public ConcreteViewShadowNode<
                                   SliderComponentName,
                                   SliderProps,
                                   SliderEventEmitter,
                                   SliderState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `ImageManager` with the node.
  void setImageManager(const SharedImageManager &imageManager);

  // Associates a shared `SliderMeasurementsManager` with the node.
  void setSliderMeasurementsManager(
      const std::shared_ptr<SliderMeasurementsManager> &measurementsManager);

  static SliderState initialStateData(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamilyFragment const &familyFragment,
      ComponentDescriptor const &componentDescriptor) {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {
        imageSource,
        {imageSource, nullptr},
        imageSource,
        {imageSource, nullptr},
        imageSource,
        {imageSource, nullptr},
        imageSource,
        {imageSource, nullptr}};
  }

#pragma mark - LayoutableShadowNode

  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  void updateStateIfNeeded();

  ImageSource getTrackImageSource() const;
  ImageSource getMinimumTrackImageSource() const;
  ImageSource getMaximumTrackImageSource() const;
  ImageSource getThumbImageSource() const;

  SharedImageManager imageManager_;
  std::shared_ptr<SliderMeasurementsManager> measurementsManager_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
