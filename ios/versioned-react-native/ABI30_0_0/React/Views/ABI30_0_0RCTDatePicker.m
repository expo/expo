/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTDatePicker.h"

#import "ABI30_0_0RCTUtils.h"
#import "UIView+ReactABI30_0_0.h"

@interface ABI30_0_0RCTDatePicker ()

@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onChange;

@end

@implementation ABI30_0_0RCTDatePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self addTarget:self action:@selector(didChange)
               forControlEvents:UIControlEventValueChanged];
  }
  return self;
}

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{ @"timestamp": @(self.date.timeIntervalSince1970 * 1000.0) });
  }
}

@end
