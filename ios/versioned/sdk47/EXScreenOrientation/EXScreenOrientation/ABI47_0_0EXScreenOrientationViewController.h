// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

@interface ABI47_0_0EXScreenOrientationViewController : UIViewController

- (instancetype)init;

- (instancetype)initWithDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientationMask;

- (instancetype)initDefaultScreenOrientationFromPlist;

@end
