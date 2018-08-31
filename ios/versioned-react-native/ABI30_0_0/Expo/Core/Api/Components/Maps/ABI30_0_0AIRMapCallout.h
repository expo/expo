//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>


@interface ABI30_0_0AIRMapCallout : ABI30_0_0RCTView

@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onPress;

@end
