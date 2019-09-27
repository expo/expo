//
//  EXOtaUpdater.h
//  EXOta
//
//  Created by Michał Czernek on 05/09/2019.
//

#ifndef EXOtaUpdater_h
#define EXOtaUpdater_h

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
 
@protocol EXManifestRequestConfig

@property(nonnull, readonly) NSString *manifestUrl;
@property(nullable, readonly) NSDictionary *manifestRequestHeaders;
@property(readonly) NSInteger requestTimeout;

@end

typedef void (^EXManifestSuccessBlock)(NSDictionary* manifest);
typedef void (^EXManifestErrorBlock)(NSError* error);

@interface EXOtaUpdater: NSObject<NSURLSessionTaskDelegate>

- (id)initWithConfig:(nonnull id<EXManifestRequestConfig>)config;

- (void)downloadManifest:(nonnull EXManifestSuccessBlock)success error:(nonnull EXManifestErrorBlock)error;

@end

#endif /* EXOtaUpdater_h */

NS_ASSUME_NONNULL_END
