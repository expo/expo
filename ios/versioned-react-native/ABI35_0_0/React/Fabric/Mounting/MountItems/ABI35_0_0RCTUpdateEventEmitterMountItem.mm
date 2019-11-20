/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTUpdateEventEmitterMountItem.h"

#import "ABI35_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI35_0_0;

@implementation ABI35_0_0RCTUpdateEventEmitterMountItem {
  ReactABI35_0_0Tag _tag;
  SharedEventEmitter _eventEmitter;
}

- (instancetype)initWithTag:(ReactABI35_0_0Tag)tag
              eventEmitter:(SharedEventEmitter)eventEmitter
{
  if (self = [super init]) {
    _tag = tag;
    _eventEmitter = eventEmitter;
  }

  return self;
}

- (void)executeWithRegistry:(ABI35_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI35_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];

  [componentView updateEventEmitter:_eventEmitter];
}

@end
