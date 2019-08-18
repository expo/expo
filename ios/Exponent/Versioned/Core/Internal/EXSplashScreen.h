// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTView.h>
#import <React/RCTBridgeModule.h>

@interface EXSplashScreen : NSObject <RCTBridgeModule>

@property (assign) BOOL started;
@property (assign) BOOL finished;

@end
