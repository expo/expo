/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTUpdateLocalDataMountItem.h"

#import "ABI31_0_0RCTComponentViewRegistry.h"

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTUpdateLocalDataMountItem {
  ReactABI31_0_0Tag _tag;
  SharedLocalData _oldLocalData;
  SharedLocalData _newLocalData;
}

- (instancetype)initWithTag:(ReactABI31_0_0Tag)tag
               oldLocalData:(facebook::ReactABI31_0_0::SharedLocalData)oldLocalData
               newLocalData:(facebook::ReactABI31_0_0::SharedLocalData)newLocalData
{
  if (self = [super init]) {
    _tag = tag;
    _oldLocalData = oldLocalData;
    _newLocalData = newLocalData;
  }

  return self;
}

- (void)executeWithRegistry:(ABI31_0_0RCTComponentViewRegistry *)registry
{
  UIView<ABI31_0_0RCTComponentViewProtocol> *componentView = [registry componentViewByTag:_tag];
  [componentView updateLocalData:_newLocalData oldLocalData:_oldLocalData];
}

@end
