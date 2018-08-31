// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>

@interface ABI30_0_0EXAppState : ABI30_0_0RCTEventEmitter

/**
 *  Kernel manages the state of each bridge and passes it here. 
 */
- (void)setState:(NSString *)state;

@property (nonatomic, strong, readonly) NSString *lastKnownState;

@end
