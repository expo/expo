// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTEventEmitter.h>

@interface EXAppState : RCTEventEmitter

/**
 *  Kernel manages the state of each bridge and passes it here. 
 */
- (void)setState:(NSString *)state;

@property (nonatomic, strong, readonly) NSString *lastKnownState;

@end
