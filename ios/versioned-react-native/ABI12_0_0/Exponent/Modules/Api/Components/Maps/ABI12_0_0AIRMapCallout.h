//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ABI12_0_0RCTView.h"


@interface ABI12_0_0AIRMapCallout : ABI12_0_0RCTView

@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI12_0_0RCTBubblingEventBlock onPress;

@end
