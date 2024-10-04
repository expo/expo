//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>


@interface ABI42_0_0AIRMapCallout : ABI42_0_0RCTView

@property (nonatomic, assign) BOOL tooltip;
@property (nonatomic, copy) ABI42_0_0RCTBubblingEventBlock onPress;
@property (nonatomic, assign) BOOL alphaHitTest;

- (BOOL) isPointInside:(CGPoint)pointInCallout;

@end
