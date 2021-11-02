//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXManifests/EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestsManifestFactory : NSObject

+ (nonnull EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON;

@end

NS_ASSUME_NONNULL_END
