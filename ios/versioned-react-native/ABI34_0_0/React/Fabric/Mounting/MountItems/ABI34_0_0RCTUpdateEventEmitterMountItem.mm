/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTUpdateEventEmitterMountItem.h"

#import "ABI34_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTUpdateEventEmitterMountItem {
  ReactABI34_0_0Tag _tag;
  SharedEventEmitter _eventEmitter;
}

- (instancetype)initWithTag:(ReactABI34_0_0Tag)tag
              eventEmitter:(SharedEventEmitter)eventEmitter
{
  if (self = [super init]) {
    _tag = tag;
    _eventEmitter = eventEmitter;
  }

  return self;
}

- (void)executeWithRegistry:(ABI34_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI34_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateEventEmitter:_eventEmitter];
}

@end
