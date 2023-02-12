/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTUnimplementedViewComponentView.h"

#import <ABI48_0_0React/ABI48_0_0renderer/components/rncore/ComponentDescriptors.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/rncore/EventEmitters.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/rncore/Props.h>

#import <ABI48_0_0React/ABI48_0_0renderer/components/unimplementedview/UnimplementedViewComponentDescriptor.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/unimplementedview/UnimplementedViewShadowNode.h>

#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>

#import "ABI48_0_0RCTFabricComponentsPlugins.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@implementation ABI48_0_0RCTUnimplementedViewComponentView {
  UILabel *_label;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<UnimplementedViewProps const>();
    _props = defaultProps;

    _label = [[UILabel alloc] initWithFrame:self.bounds];
    _label.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3];
    _label.lineBreakMode = NSLineBreakByCharWrapping;
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;
    _label.textColor = [UIColor whiteColor];
    _label.allowsDefaultTighteningForTruncation = YES;
    _label.adjustsFontSizeToFitWidth = YES;

    self.contentView = _label;
  }

  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldUnimplementedViewProps = *std::static_pointer_cast<UnimplementedViewProps const>(_props);
  auto const &newUnimplementedViewProps = *std::static_pointer_cast<UnimplementedViewProps const>(props);

  if (oldUnimplementedViewProps.getComponentName() != newUnimplementedViewProps.getComponentName()) {
    _label.text =
        [NSString stringWithFormat:@"Unimplemented component: <%s>", newUnimplementedViewProps.getComponentName()];
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RCTUnimplementedNativeViewCls(void)
{
  return ABI48_0_0RCTUnimplementedViewComponentView.class;
}
