// Copyright 2015-present 650 Industries. All rights reserved.

#import <React-RCTAppDelegate/RCTAppDelegate.h>
#import <React/RCTBridgeDelegate.h>

@interface RCTAppDelegate (DevMenuRCTAppDelegate)

#ifdef __cplusplus
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge;
#endif
@end
