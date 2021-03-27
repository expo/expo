//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>

@class ABI39_0_0EXSyncDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI39_0_0EXSyncManifestStatus) {
  ABI39_0_0EXSyncManifestStatusFailed = 0,
  ABI39_0_0EXSyncManifestStatusReady = 1,
  ABI39_0_0EXSyncManifestStatusLaunchable = 2,
  ABI39_0_0EXSyncManifestStatusPending = 3,
  ABI39_0_0EXSyncManifestStatusUnused = 4,
  ABI39_0_0EXSyncManifestStatusEmbedded = 5,
  ABI39_0_0EXSyncManifestStatusDevelopment = 6
};

@interface ABI39_0_0EXSyncManifest : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary * metadata;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<ABI39_0_0EXSyncAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly) NSDictionary *rawManifest;

@property (nonatomic, assign) ABI39_0_0EXSyncManifestStatus status;

+ (instancetype)updateWithId:(NSUUID *)updateId
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(ABI39_0_0EXSyncManifestStatus)status
                        keep:(BOOL)keep
                      config:(ABI39_0_0EXSyncConfig *)config
                    database:(ABI39_0_0EXSyncDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                            config:(ABI39_0_0EXSyncConfig *)config
                          database:(ABI39_0_0EXSyncDatabase *)database;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI39_0_0EXSyncConfig *)config
                                  database:(nullable ABI39_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
