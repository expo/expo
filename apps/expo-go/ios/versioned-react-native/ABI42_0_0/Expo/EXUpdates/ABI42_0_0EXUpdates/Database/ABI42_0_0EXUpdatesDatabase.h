//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesAsset.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI42_0_0EXUpdatesDatabaseHashType) {
  ABI42_0_0EXUpdatesDatabaseHashTypeSha1 = 0
};

@interface ABI42_0_0EXUpdatesDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(ABI42_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<ABI42_0_0EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
/**
 * This method may return NO if a matching entry for the existing asset cannot be found in the database.
 * In this case, the error pointer will not be set.
 */
- (BOOL)addExistingAsset:(ABI42_0_0EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(ABI42_0_0EXUpdatesAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(ABI42_0_0EXUpdatesAsset *)asset withExistingEntry:(ABI42_0_0EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(ABI42_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markUpdateAccessed:(ABI42_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(ABI42_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)markMissingAssets:(NSArray<ABI42_0_0EXUpdatesAsset *> *)assets error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<ABI42_0_0EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI42_0_0EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

/**
 * This method ignores the scopeKey field in the config object and returns ALL updates in the database.
 * The config object is passed along to each update object, even if its scopeKey doesn't match.
 *
 * Updates returned from this method should not be used to launch.
 */
- (nullable NSArray<ABI42_0_0EXUpdatesUpdate *> *)allUpdatesWithConfig:(ABI42_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI42_0_0EXUpdatesUpdate *> *)allUpdatesWithStatus:(ABI42_0_0EXUpdatesUpdateStatus)status config:(ABI42_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI42_0_0EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(ABI42_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable ABI42_0_0EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(ABI42_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI42_0_0EXUpdatesAsset *> *)allAssetsWithError:(NSError ** _Nullable)error;
- (nullable NSArray<ABI42_0_0EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable ABI42_0_0EXUpdatesAsset *)assetWithKey:(nullable NSString *)key error:(NSError ** _Nullable)error;

- (nullable NSDictionary *)serverDefinedHeadersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)manifestFiltersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setServerDefinedHeaders:(NSDictionary *)serverDefinedHeaders withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setManifestFilters:(NSDictionary *)manifestFilters withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setMetadataWithManifest:(ABI42_0_0EXUpdatesUpdate *)updateManifest error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
