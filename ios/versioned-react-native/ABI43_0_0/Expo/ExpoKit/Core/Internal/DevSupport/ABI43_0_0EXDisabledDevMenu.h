// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0RCTTurboModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTDevMenu.h>

@interface ABI43_0_0EXDisabledDevMenu : NSObject <ABI43_0_0RCTBridgeModule, ABI43_0_0RCTTurboModule>

@property (nonatomic) BOOL shakeToShow;
@property (nonatomic) BOOL profilingEnabled;
@property (nonatomic) BOOL liveReloadEnabled;
@property (nonatomic) BOOL showFPS;

- (void)show;
- (void)reload;
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler DEPRECATED_ATTRIBUTE;
- (void)addItem:(ABI43_0_0RCTDevMenuItem *)item;

@end
