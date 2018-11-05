// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>

@interface ABI28_0_0EXGLObjectManager : NSObject <ABI28_0_0RCTBridgeModule>

- (void)saveContext:(nonnull id)glContext;
- (void)deleteContextWithId:(nonnull NSNumber *)contextId;

@end
