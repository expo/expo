// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTEventEmitter.h>

@interface ABI28_0_0EXAppState : ABI28_0_0RCTEventEmitter

/**
 *  Kernel manages the state of each bridge and passes it here. 
 */
- (void)setState:(NSString *)state;

@property (nonatomic, strong, readonly) NSString *lastKnownState;

@end
