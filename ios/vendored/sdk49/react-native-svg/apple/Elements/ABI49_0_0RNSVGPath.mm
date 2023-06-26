/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGPath.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI49_0_0RNSVGFabricConversions.h"
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@implementation ABI49_0_0RNSVGPath {
  CGPathRef _path;
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
using namespace ABI49_0_0facebook::ABI49_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI49_0_0RNSVGPathProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI49_0_0RNSVGPathComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI49_0_0RNSVGPathProps>(props);
  self.d = [[ABI49_0_0RNSVGPathParser alloc] initWithPathString:ABI49_0_0RCTNSStringFromString(newProps.d)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI49_0_0RNSVGPathProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  if (_path) {
    CGPathRelease(_path);
  }
  _path = nil;
  _d = nil;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)setD:(ABI49_0_0RNSVGPathParser *)d
{
  if (d == _d) {
    return;
  }

  [self invalidate];
  _d = d;
  CGPathRelease(_path);
  _path = CGPathRetain([d getPath]);
}

- (CGPathRef)getPath:(CGContextRef)context
{
  return _path;
}

- (void)dealloc
{
  CGPathRelease(_path);
}

@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSVGPathCls(void)
{
  return ABI49_0_0RNSVGPath.class;
}
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
