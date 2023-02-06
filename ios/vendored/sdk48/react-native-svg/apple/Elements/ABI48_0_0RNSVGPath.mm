/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RNSVGPath.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI48_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI48_0_0RNSVGPath {
  CGPathRef _path;
}

#ifdef RN_FABRIC_ENABLED
using namespace ABI48_0_0facebook::ABI48_0_0React;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0RNSVGPathProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI48_0_0RNSVGPathComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI48_0_0RNSVGPathProps>(props);
  self.d = [[ABI48_0_0RNSVGPathParser alloc] initWithPathString:ABI48_0_0RCTNSStringFromString(newProps.d)];

  setCommonRenderableProps(newProps, self);
  _props = std::static_pointer_cast<ABI48_0_0RNSVGPathProps const>(props);
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
#endif // RN_FABRIC_ENABLED

- (void)setD:(ABI48_0_0RNSVGPathParser *)d
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

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSVGPathCls(void)
{
  return ABI48_0_0RNSVGPath.class;
}
#endif // RN_FABRIC_ENABLED
