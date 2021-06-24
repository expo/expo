// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTRedBox.h>
#import <React/RCTLogBox.h>

#import "EXDevLauncherRedBoxProtocol.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXDevLauncherRedBox : NSObject <EXDevLauncherRedBoxProtocol>

/**
  This function will work fine as long as `EXDevLauncherRedBoxProtocol` is similar to `RCTRedBox` implementation.
  We could inherit from `RCTRedBox`, but we don't want to initialize the base module.
 */
- (RCTRedBox *)unsafe_castToRCTRedBox;

- (void)registerLogBox:(RCTLogBox * _Nullable)logBox;

@end

NS_ASSUME_NONNULL_END
