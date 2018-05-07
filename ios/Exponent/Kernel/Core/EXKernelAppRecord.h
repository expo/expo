// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelBridgeDidForegroundNotification;
FOUNDATION_EXPORT NSString *kEXKernelBridgeDidBackgroundNotification;

@class EXAppViewController;
@class EXReactAppManager;
@class EXAppLoader;

typedef enum EXKernelAppRecordStatus {
  kEXKernelAppRecordStatusNew, // record just created
  kEXKernelAppRecordStatusDownloading, // resolving manifest or bundle
  kEXKernelAppRecordStatusBridgeLoading, // bridge not loaded yet
  kEXKernelAppRecordStatusRunning, // app is running
  kEXKernelAppRecordStatusError,
} EXKernelAppRecordStatus;

@interface EXKernelAppRecord : NSObject

- (instancetype)initWithManifestUrl:(NSURL *)manifestUrl initialProps:(nullable NSDictionary *)initialProps;
- (instancetype)initWithAppLoader:(EXAppLoader *)customAppLoader
                       appManager:(EXReactAppManager *)customAppManager;

@property (nonatomic, readonly, assign) EXKernelAppRecordStatus status;
@property (nonatomic, readonly, strong) NSDate *timeCreated;
@property (nonatomic, readonly) NSString * _Nullable experienceId;
@property (nonatomic, readonly) EXReactAppManager *appManager;
@property (nonatomic, readonly, strong) EXAppLoader *appLoader;
@property (nonatomic, readonly) EXAppViewController *viewController;

/**
 *  See EXKernelAppRegistry::setError:forAppRecord:
 */
@property (nonatomic, strong)  NSError * _Nullable error;

@end

NS_ASSUME_NONNULL_END
