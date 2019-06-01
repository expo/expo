// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>
#import <ReactABI33_0_0/ABI33_0_0RCTConvert.h>

#import "ABI33_0_0EXScopedEventEmitter.h"

typedef NS_ENUM(NSInteger, ABI33_0_0EXOrientation) {
    ABI33_0_0EXOrientationPortrait,
    ABI33_0_0EXOrientationPortraitUp,
    ABI33_0_0EXOrientationPortraitDown,
    ABI33_0_0EXOrientationLandscape,
    ABI33_0_0EXOrientationLandscapeLeft,
    ABI33_0_0EXOrientationLandscapeRight,
    ABI33_0_0EXOrientationUnknown
};

typedef NS_ENUM(NSInteger, ABI33_0_0EXOrientationLock) {
  ABI33_0_0EXOrientationDefaultLock,
  ABI33_0_0EXOrientationAllLock,
  ABI33_0_0EXOrientationPortraitLock,
  ABI33_0_0EXOrientationPortraitUpLock,
  ABI33_0_0EXOrientationPortraitDownLock,
  ABI33_0_0EXOrientationLandscapeLock,
  ABI33_0_0EXOrientationLandscapeLeftLock,
  ABI33_0_0EXOrientationLandscapeRightLock,
  ABI33_0_0EXOrientationOtherLock,
  ABI33_0_0EXOrientationAllButUpsideDownLock // deprecated
};

@interface ABI33_0_0RCTConvert (OrientationLock)

+ (ABI33_0_0EXOrientationLock)ABI33_0_0EXOrientationLock:(id)json;

@end

@protocol ABI33_0_0EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(NSString *)experienceId;

- (void)addOrientationChangeListener:(NSString *)experienceId subscriberModule:(id)subscriberModule;

- (UITraitCollection *)getTraitCollection;

@end

@interface ABI33_0_0EXScreenOrientation : ABI33_0_0EXScopedEventEmitter <ABI33_0_0RCTBridgeModule>

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

+ (NSDictionary *)getStringToOrientationLockJSDict;
@end
