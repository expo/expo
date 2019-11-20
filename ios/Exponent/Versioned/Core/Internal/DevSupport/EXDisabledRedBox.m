// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDisabledRedBox.h"

@implementation EXDisabledRedBox

+ (NSString *)moduleName { return @"RCTRedBox"; }

- (void)showError:(NSError *)message {}
- (void)showErrorMessage:(NSString *)message {}
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack showIfHidden:(BOOL)shouldShow {}
- (void)dismiss {}
- (void)setOverrideReloadAction:(dispatch_block_t __unused)block {}

@end
