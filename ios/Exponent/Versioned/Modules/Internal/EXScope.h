// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

/**
 *  Catchall module for scoped utility methods
 */

@interface EXScope : EXScopedBridgeModule

@property (nonatomic, readonly) NSURL *initialUri;
@property (nonatomic, readonly) NSString *appOwnership;

@end

EX_DECLARE_SCOPED_MODULE(EXScope, scope)
