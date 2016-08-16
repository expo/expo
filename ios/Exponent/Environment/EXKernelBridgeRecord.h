// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelBridgeDidForegroundNotification;
FOUNDATION_EXPORT NSString *kEXKernelBridgeDidBackgroundNotification;

@interface EXKernelBridgeRecord : NSObject

+ (instancetype)recordWithExperienceId: (NSString *)experienceId initialUri: (NSURL *)initialUri;
- (instancetype)initWithExperienceId: (NSString *)experienceId initialUri: (NSURL *)initialUri;

@property (nonatomic, readonly, strong) NSString *experienceId;
@property (nonatomic, readonly, strong) NSURL *initialUri;

/**
 *  See EXKernelBridgeRegistry::setError:forBridge:
 */
@property (nonatomic, strong)  NSError * _Nullable error;

@end

NS_ASSUME_NONNULL_END
