//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesUpdateStatus) {
  EXUpdatesUpdateStatusFailed = 0,
  EXUpdatesUpdateStatusReady = 1,
  EXUpdatesUpdateStatusLaunchable = 2,
  EXUpdatesUpdateStatusPending = 3,
  EXUpdatesUpdateStatusUnused = 4,
  EXUpdatesUpdateStatusEmbedded = 5
};

@interface EXUpdatesUpdate : NSObject

@property (nonatomic, strong, readonly) NSUUID *updateId;
@property (nonatomic, strong, readonly) NSString *projectIdentifier;
@property (nonatomic, strong, readonly) NSDate *commitTime;
@property (nonatomic, strong, readonly) NSString *runtimeVersion;
@property (nonatomic, strong, readonly, nullable) NSDictionary * metadata;
@property (nonatomic, assign, readonly) BOOL keep;
@property (nonatomic, strong, readonly) NSArray<EXUpdatesAsset *> *assets;

@property (nonatomic, strong, readonly) NSDictionary *rawManifest;

@property (nonatomic, assign) EXUpdatesUpdateStatus status;

+ (instancetype)updateWithId:(NSUUID *)updateId
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep;

+ (instancetype)updateWithManifest:(NSDictionary *)manifest;
+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END
