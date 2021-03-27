//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncAsset.h>
#import <EXUpdates/EXSyncConfig.h>

@class EXSyncDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXSyncManifestStatus) {
  EXSyncManifestStatusFailed = 0,
  EXSyncManifestStatusReady = 1,
  EXSyncManifestStatusLaunchable = 2,
  EXSyncManifestStatusPending = 3,
  EXSyncManifestStatusUnused = 4,
  EXSyncManifestStatusEmbedded = 5,
  EXSyncManifestStatusDevelopment = 6
};

@interface EXSyncManifest : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary * metadata;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<EXSyncAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestFilters;

@property (nonatomic, strong, readonly) NSDictionary *rawManifest;

@property (nonatomic, assign) EXSyncManifestStatus status;

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(EXSyncManifestStatus)status
                        keep:(BOOL)keep
                      config:(EXSyncConfig *)config
                    database:(EXSyncDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                          response:(nullable NSURLResponse *)response
                            config:(EXSyncConfig *)config
                          database:(EXSyncDatabase *)database;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(EXSyncConfig *)config
                                  database:(nullable EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
