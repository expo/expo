// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTBridgeModule.h"
#import "RCTDevMenu.h"

@interface EXDisabledDevMenu : NSObject <RCTBridgeModule>

@property (nonatomic) BOOL shakeToShow;
@property (nonatomic) BOOL profilingEnabled;
@property (nonatomic) BOOL liveReloadEnabled;
@property (nonatomic) BOOL showFPS;

- (void)show;
- (void)reload;
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler DEPRECATED_ATTRIBUTE;
- (void)addItem:(RCTDevMenuItem *)item;


@end
