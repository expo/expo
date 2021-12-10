//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesManifestHeaders.h>
#import <EXManifests/EXManifestsManifest.h>

@class EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

/**
 * Download status that indicates whether or under what conditions an
 * update is able to be launched.
 *
 * It's important that the integer value of each status stays constant across
 * all versions of this library since they are stored in SQLite on user devices.
 */
typedef NS_ENUM(NSInteger, EXUpdatesUpdateStatus) {
  EXUpdatesUpdateStatus0_Unused = 0,
  /**
   * The update has been fully downloaded and is ready to launch.
   */
  EXUpdatesUpdateStatusReady = 1,
  EXUpdatesUpdateStatus2_Unused = 2,
  /**
   * The update manifest has been download from the server but not all
   * assets have finished downloading successfully.
   */
  EXUpdatesUpdateStatusPending = 3,
  EXUpdatesUpdateStatus4_Unused = 4,
  /**
   * The update has been partially loaded (copied) from its location
   * embedded in the app bundle, but not all assets have been copied
   * successfully. The update may be able to be launched directly from
   * its embedded location unless a new binary version with a new
   * embedded update has been installed.
   */
  EXUpdatesUpdateStatusEmbedded = 5,
  /**
   * The update manifest has been downloaded and indicates that the
   * update is being served from a developer tool. It can be launched by a
   * host application that can run a development bundle.
   */
  EXUpdatesUpdateStatusDevelopment = 6
};

@interface EXUpdatesUpdate : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestJSON;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<EXUpdatesAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestFilters;

@property (nonatomic, strong, readonly) EXManifestsManifest *manifest;

@property (nonatomic, assign) EXUpdatesUpdateStatus status;
@property (nonatomic, strong) NSDate *lastAccessed;
@property (nonatomic, assign) NSInteger successfulLaunchCount;
@property (nonatomic, assign) NSInteger failedLaunchCount;

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    manifest:(nullable NSDictionary *)manifest
                      status:(EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(EXUpdatesConfig *)config
                    database:(EXUpdatesDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                   manifestHeaders:(EXUpdatesManifestHeaders *)manifestHeaders
                        extensions:(NSDictionary *)extensions
                            config:(EXUpdatesConfig *)config
                          database:(EXUpdatesDatabase *)database
                             error:(NSError **)error;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(EXUpdatesConfig *)config
                                  database:(nullable EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
