//
//  EXOtaUpdater.h
//  EXOta
//
//  Created by Michał Czernek on 05/09/2019.
//

#ifndef EXOtaUpdater_h
#define EXOtaUpdater_h

#import <Foundation/Foundation.h>
#import "EXOta.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXManifestSuccessBlock)(NSDictionary* manifest);
typedef void (^EXUpdateSuccessBlock)(NSDictionary* manifest, NSString *filePath);
typedef void (^EXErrorBlock)(NSError* error);

@interface EXOtaUpdater: NSObject<NSURLSessionTaskDelegate>

- (id)initWithConfig:(id<EXOtaConfig>)config withId:(NSString*)identifier;

- (void)downloadManifest:(nonnull EXManifestSuccessBlock)success error:(nonnull EXErrorBlock)error;

- (void)checkAndDownloadUpdate:(nonnull EXUpdateSuccessBlock)successBlock updateUnavailable:(void (^)(void))unavailableBlock error:(nonnull EXErrorBlock)errorBlock;

- (void)prepareToReload;

- (void)removeOutdatedBundle;

- (void)cleanUnusedFiles;

@end

#endif /* EXOtaUpdater_h */

NS_ASSUME_NONNULL_END
