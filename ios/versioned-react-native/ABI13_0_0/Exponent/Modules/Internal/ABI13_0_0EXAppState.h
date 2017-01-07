// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTEventEmitter.h>

@interface ABI13_0_0EXAppState : ABI13_0_0RCTEventEmitter

/**
 *  Kernel manages the state of each bridge and passes it here. 
 */
- (void)setState:(NSString *)state;

@property (nonatomic, strong, readonly) NSString *lastKnownState;

@end
