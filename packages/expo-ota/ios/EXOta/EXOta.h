//
//  EXOta.h
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ManifestComparator

-(BOOL) shouldDownloadBundle:(NSDictionary*)oldManifest forNew:(NSDictionary*)newManifest;

@end

@protocol EXOtaConfig

@property(nonnull, readonly) NSString *manifestUrl;
@property(nullable, readonly) NSDictionary *manifestRequestHeaders;
@property(nullable, readonly) NSString *channelIdentifier;
@property(readonly) NSInteger manifestRequestTimeout;
@property(readonly) id<ManifestComparator> manifestComparator;
@property(readonly) NSInteger bundleRequestTimeout;

@end

@interface EXOta : NSObject

-(id)initWithConfig:(id<EXOtaConfig>)config;

-(id)initWithId:(NSString*)appId withConfig:(id<EXOtaConfig>)config;

-(void)start;

@property (readonly) NSString *bundlePath;

@end

NS_ASSUME_NONNULL_END
