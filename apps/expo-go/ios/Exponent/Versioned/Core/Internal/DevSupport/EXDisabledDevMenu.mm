// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDisabledDevMenu.h"

@implementation EXDisabledDevMenu

+ (NSString *)moduleName { return @"RCTDevMenu"; }

RCT_NOT_IMPLEMENTED(- (void)show)
RCT_NOT_IMPLEMENTED(- (void)reload)

// Stub out methods that are called but don't need to do anything
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(RCTDevMenuItem *)item {}

@end
