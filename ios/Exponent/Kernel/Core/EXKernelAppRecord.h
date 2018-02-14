// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXKernelAppLoader.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelBridgeDidForegroundNotification;
FOUNDATION_EXPORT NSString *kEXKernelBridgeDidBackgroundNotification;

@class EXFrameReactAppManager;

typedef enum EXKernelAppRecordStatus {
  EXKernelAppRecordStatusNew, // record just created, has no manifest
  EXKernelAppRecordStatusHasManifest, // has remote manifest, but does not have bundle yet
  EXKernelAppRecordStatusHasManifestAndBundle, // has downloaded manifest and bundle, but we have not heard from bridge yet
  EXKernelAppRecordStatusRunning // has loaded everything and successfully sent bundle to bridge
} EXKernelAppRecordStatus;

@interface EXKernelAppRecord : NSObject

+ (instancetype)recordWithManifestUrl:(NSURL *)manifestUrl;
- (instancetype)initWithManifestUrl:(NSURL *)manifestUrl;

@property (nonatomic, readonly, assign) EXKernelAppRecordStatus status;
@property (nonatomic, readonly, strong) NSURL *manifestUrl;
@property (nonatomic, readonly, strong) NSString * _Nullable experienceId;
@property (nonatomic, readonly, strong) NSDate *timeCreated;
@property (nonatomic, weak) EXFrameReactAppManager * _Nullable appManager;
@property (nonatomic, readonly, strong) EXKernelAppLoader *appLoader;
@property (nonatomic, assign) BOOL experienceFinishedLoading;

/**
 *  See EXKernelAppRegistry::setError:forAppRecord:
 */
@property (nonatomic, strong)  NSError * _Nullable error;

@end

NS_ASSUME_NONNULL_END
