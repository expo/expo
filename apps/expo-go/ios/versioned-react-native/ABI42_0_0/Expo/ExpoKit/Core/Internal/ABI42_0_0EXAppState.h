// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0EXAppState : ABI42_0_0RCTEventEmitter

/**
 *  Kernel manages the state of each bridge and passes it here. 
 */
- (void)setState:(NSString *)state;

@property (nonatomic, strong, readonly) NSString *lastKnownState;

@end
