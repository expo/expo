//
//  EXOta.h
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ManifestComparator

-(BOOL) shouldReplaceBundle:(NSDictionary *)oldManifest forNew:(NSDictionary *)newManifest;

@end

@protocol ManifestResponseValidator

-(void) verifyManifest:(NSDictionary *)response success:(void (^)(NSDictionary *))successBlock error:(void (^)(NSError *))errorBlock;

@end

@protocol EXOtaConfig

@property(nonnull, readonly) NSString *manifestUrl;
@property(nullable, readonly) NSDictionary *manifestRequestHeaders;
@property(nullable, readonly) NSString *channelIdentifier;
@property(readonly) NSInteger manifestRequestTimeout;
@property(readonly) id<ManifestComparator> manifestComparator;
@property(readonly) id<ManifestResponseValidator> manifestValidator;
@property(readonly) NSInteger bundleRequestTimeout;
@property(readonly) Boolean checkForUpdatesAutomatically;

@end

@interface EXOta : NSObject

- (id)init;

- (id)initWithConfig:(id<EXOtaConfig>)config;

- (id)initWithId:(NSString *)appId withConfig:(id<EXOtaConfig>)config;

- (void)start;

@property (readonly) NSString *bundlePath;

@end

NS_ASSUME_NONNULL_END
