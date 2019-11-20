/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTUpdateLocalDataMountItem.h"

#import "ABI34_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTUpdateLocalDataMountItem {
  ReactABI34_0_0Tag _tag;
  SharedLocalData _oldLocalData;
  SharedLocalData _newLocalData;
}

- (instancetype)initWithTag:(ReactABI34_0_0Tag)tag
               oldLocalData:(facebook::ReactABI34_0_0::SharedLocalData)oldLocalData
               newLocalData:(facebook::ReactABI34_0_0::SharedLocalData)newLocalData
{
  if (self = [super init]) {
    _tag = tag;
    _oldLocalData = oldLocalData;
    _newLocalData = newLocalData;
  }

  return self;
}

- (void)executeWithRegistry:(ABI34_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI34_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];
  [componentView updateLocalData:_newLocalData oldLocalData:_oldLocalData];
}

@end
