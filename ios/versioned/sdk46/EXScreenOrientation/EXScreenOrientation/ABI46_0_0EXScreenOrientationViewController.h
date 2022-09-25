// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>

@interface ABI46_0_0EXScreenOrientationViewController : UIViewController

- (instancetype)init;

- (instancetype)initWithDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientationMask;

- (instancetype)initDefaultScreenOrientationFromPlist;

@end
