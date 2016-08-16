// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTBridgeModule.h"

/**
 *  Provides the extra native modules required to set up the exponent kernel environment.
 */
extern __attribute__((visibility("default"))) NSArray<id<RCTBridgeModule>> *(^EXKernelModuleProvider)(NSDictionary *launchOptions);