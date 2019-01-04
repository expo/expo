// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>

#import "EXScopedEventEmitter.h"

typedef NS_ENUM (NSInteger, EXOrientation) {
    PORTRAIT,
    PORTRAIT_UP,
    PORTRAIT_DOWN,
    LANDSCAPE,
    LANDSCAPE_LEFT,
    LANDSCAPE_RIGHT,
    UNKNOWN
};

typedef NS_ENUM(NSInteger, EXOrientationLock) {
  DEFAULT_LOCK,
  ALL_LOCK,
  PORTRAIT_LOCK,
  PORTRAIT_UP_LOCK,
  PORTRAIT_DOWN_LOCK,
  LANDSCAPE_LOCK,
  LANDSCAPE_LEFT_LOCK,
  LANDSCAPE_RIGHT_LOCK,
  OTHER_LOCK,
  ALL_BUT_UPSIDE_DOWN_LOCK // deprecated
};

@interface RCTConvert (OrientationLock)

+ (EXOrientationLock)EXOrientationLock:(id)json;

@end

@protocol EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(NSString *) experienceId;

- (void)addOrientationChangeListener:(NSString *) experienceId subscriberModule:(id) subscriberModule;

- (UITraitCollection *) getTraitCollection;

@end

@interface EXScreenOrientation : EXScopedEventEmitter <RCTBridgeModule>

- (void) handleScreenOrientationChange:(nullable UITraitCollection *) traitCollection;

+ (NSDictionary *)getStrToOrientationLockDict;
+ (NSDictionary *)getOrientationLockToStrDict;
+ (NSDictionary *)getStrToOrientationDict;
+ (NSDictionary *)getOrientationToStrDict;
@end
