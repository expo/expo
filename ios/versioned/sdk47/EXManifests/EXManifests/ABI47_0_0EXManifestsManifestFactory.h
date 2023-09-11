//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXManifestsManifestFactory : NSObject

+ (nonnull ABI47_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON;

@end

NS_ASSUME_NONNULL_END
