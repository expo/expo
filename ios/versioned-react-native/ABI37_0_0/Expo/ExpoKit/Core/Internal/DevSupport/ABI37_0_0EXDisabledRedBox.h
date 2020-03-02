// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>

@interface ABI37_0_0EXDisabledRedBox : NSObject <ABI37_0_0RCTBridgeModule>

- (void)showError:(NSError *)error;
- (void)showErrorMessage:(NSString *)message;
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details;
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack;
- (void)setOverrideReloadAction:(dispatch_block_t __unused)block;
- (void)dismiss;

@end
