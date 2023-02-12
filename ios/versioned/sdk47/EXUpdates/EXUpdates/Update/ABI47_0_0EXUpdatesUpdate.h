//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAsset.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesManifestHeaders.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsManifest.h>

@class ABI47_0_0EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

/**
 * Download status that indicates whether or under what conditions an
 * update is able to be launched.
 *
 * It's important that the integer value of each status stays constant across
 * all versions of this library since they are stored in SQLite on user devices.
 */
typedef NS_ENUM(NSInteger, ABI47_0_0EXUpdatesUpdateStatus) {
  ABI47_0_0EXUpdatesUpdateStatus0_Unused = 0,
  /**
   * The update has been fully downloaded and is ready to launch.
   */
  ABI47_0_0EXUpdatesUpdateStatusReady = 1,
  ABI47_0_0EXUpdatesUpdateStatus2_Unused = 2,
  /**
   * The update manifest has been download from the server but not all
   * assets have finished downloading successfully.
   */
  ABI47_0_0EXUpdatesUpdateStatusPending = 3,
  ABI47_0_0EXUpdatesUpdateStatus4_Unused = 4,
  /**
   * The update has been partially loaded (copied) from its location
   * embedded in the app bundle, but not all assets have been copied
   * successfully. The update may be able to be launched directly from
   * its embedded location unless a new binary version with a new
   * embedded update has been installed.
   */
  ABI47_0_0EXUpdatesUpdateStatusEmbedded = 5,
  /**
   * The update manifest has been downloaded and indicates that the
   * update is being served from a developer tool. It can be launched by a
   * host application that can run a development bundle.
   */
  ABI47_0_0EXUpdatesUpdateStatusDevelopment = 6
};


/**
 * Represents an update object and all its associated properties.
 *
 * expo-updates treats most fields (other than `status`, `keep`, `lastAccessed`, and the launch
 * counts) as effectively immutable once in the database. This means an update server should never
 * host two manifests with the same `id` that differ in any other field, as expo-updates will not
 * take the difference into account.
 *
 * The `scopeKey` field is only relevant in environments such as Expo Go in which updates from
 * multiple scopes can be launched.
 *
 * The methods in this class initialize an update object from a manifest by determining the
 * manifest type and then parsing it.
 */
@interface ABI47_0_0EXUpdatesUpdate : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *scopeKey;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestJSON;
@property (nonatomic, assign, readonly) BOOL keep;
/**
 * Accessing this property may lazily load the assets from the database, if this update object
 * originated from the database.
 */
@property (nonatomic, strong, readonly) NSArray<ABI47_0_0EXUpdatesAsset *> *assets;
@property (nonatomic, assign, readonly) BOOL isDevelopmentMode;

@property (nonatomic, strong, readonly, nullable) NSDictionary *serverDefinedHeaders;
@property (nonatomic, strong, readonly, nullable) NSDictionary *manifestFilters;
@property (nonatomic, strong, readonly, nullable) NSString *loggingId;

@property (nonatomic, strong, readonly) ABI47_0_0EXManifestsManifest *manifest;

@property (nonatomic, assign) ABI47_0_0EXUpdatesUpdateStatus status;
@property (nonatomic, strong) NSDate *lastAccessed;
@property (nonatomic, assign) NSInteger successfulLaunchCount;
@property (nonatomic, assign) NSInteger failedLaunchCount;

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    manifest:(nullable NSDictionary *)manifest
                      status:(ABI47_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI47_0_0EXUpdatesConfig *)config
                    database:(ABI47_0_0EXUpdatesDatabase *)database;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                   manifestHeaders:(ABI47_0_0EXUpdatesManifestHeaders *)manifestHeaders
                        extensions:(NSDictionary *)extensions
                            config:(ABI47_0_0EXUpdatesConfig *)config
                          database:(ABI47_0_0EXUpdatesDatabase *)database
                             error:(NSError **)error;

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI47_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI47_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
