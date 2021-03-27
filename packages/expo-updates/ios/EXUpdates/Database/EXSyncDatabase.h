//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncAsset.h>
#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXSyncDatabaseHashType) {
  EXSyncDatabaseHashTypeSha1 = 0
};

@interface EXSyncDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(EXSyncManifest *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<EXSyncAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
/**
 * This method may return NO if a matching entry for the existing asset cannot be found in the database.
 * In this case, the error pointer will not be set.
 */
- (BOOL)addExistingAsset:(EXSyncAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(EXSyncAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(EXSyncAsset *)asset withExistingEntry:(EXSyncAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(EXSyncManifest *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(EXSyncManifest *)update error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<EXSyncManifest *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<EXSyncAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

- (nullable NSArray<EXSyncManifest *> *)allUpdatesWithConfig:(EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXSyncManifest *> *)launchableUpdatesWithConfig:(EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable EXSyncManifest *)updateWithId:(NSUUID *)updateId config:(EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXSyncAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable EXSyncAsset *)assetWithKey:(nullable NSString *)key error:(NSError ** _Nullable)error;

- (nullable NSDictionary *)serverDefinedHeadersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (nullable NSDictionary *)manifestFiltersWithScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setServerDefinedHeaders:(NSDictionary *)serverDefinedHeaders withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setManifestFilters:(NSDictionary *)manifestFilters withScopeKey:(NSString *)scopeKey error:(NSError ** _Nullable)error;
- (void)setMetadataWithManifest:(EXSyncManifest *)updateManifest error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
