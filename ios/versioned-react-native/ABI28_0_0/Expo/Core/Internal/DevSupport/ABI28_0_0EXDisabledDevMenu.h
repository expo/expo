// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>
#import <ReactABI28_0_0/ABI28_0_0RCTDevMenu.h>

@interface ABI28_0_0EXDisabledDevMenu : NSObject <ABI28_0_0RCTBridgeModule>

@property (nonatomic) BOOL shakeToShow;
@property (nonatomic) BOOL profilingEnabled;
@property (nonatomic) BOOL liveReloadEnabled;
@property (nonatomic) BOOL showFPS;

- (void)show;
- (void)reload;
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler DEPRECATED_ATTRIBUTE;
- (void)addItem:(ABI28_0_0RCTDevMenuItem *)item;


@end
