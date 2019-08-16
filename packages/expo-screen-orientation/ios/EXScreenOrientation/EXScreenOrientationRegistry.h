// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScreenOrientationRegistry : UMSingletonModule

- (void)setOrientationMask:(UIInterfaceOrientationMask)orientationMask
          forAppId:(NSString *)appId;
- (UIInterfaceOrientationMask)orientationMaskForAppId:(NSString *)appId;
- (BOOL)doesKeyExistForAppId:(NSString *)appId;

@property (atomic, strong) NSMutableDictionary<NSString *, NSNumber *> *orientationMap;

@end

NS_ASSUME_NONNULL_END
