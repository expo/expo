/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTCreateMountItem.h"

#import "ABI34_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTCreateMountItem {
  ComponentHandle _componentHandle;
  ReactABI34_0_0Tag _tag;
}

- (instancetype)initWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle
                                    tag:(ReactABI34_0_0Tag)tag
{
  if (self = [super init]) {
    _componentHandle = componentHandle;
    _tag = tag;
  }

  return self;
}

- (void)executeWithRegistry:(ABI34_0_0RCTComponentViewRegistry *)registry
{
  [registry dequeueComponentViewWithComponentHandle:_componentHandle tag:_tag];
}

@end
