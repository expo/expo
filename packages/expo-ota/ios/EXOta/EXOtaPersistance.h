//
//  EXOtaPersistance.h
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import <Foundation/Foundation.h>
#import "EXKeyValueStorage.h"
#import "EXOta.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaPersistance : NSObject

@property (strong) id<EXOtaConfig> config;
@property (strong) NSString *appId;

- (id)initWithStorage:(EXKeyValueStorage*)storage;

- (void)storeManifest:(NSDictionary*)manifest;

- (void)storeBundle:(NSString*)bundlePath;

- (void)storeDownloadedManifest:(nullable NSDictionary*)manifest;

- (void)storeDownloadedBundle:(nullable NSString*)bundlePath;

- (void)storeOutdatedBundle:(nullable NSString*)bundlePath;

- (void)markDownloadedCurrentAndCurrentOutdated;

- (NSDictionary*)readNewestManifest;

- (NSDictionary*)readManifest;

- (NSString*)readBundlePath;

- (NSDictionary*)readDownloadedManifest;

- (NSString*)readDownloadedBundlePath;

- (NSString*)readOutdatedBundlePath;


@end

NS_ASSUME_NONNULL_END
