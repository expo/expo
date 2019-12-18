// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface EXScreenOrientationViewController : UIViewController

- (instancetype)initWithBrigde:(RCTBridge*)brigde andDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientation;

@end
