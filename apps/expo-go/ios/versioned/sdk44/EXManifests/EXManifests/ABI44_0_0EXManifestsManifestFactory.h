//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXManifestsManifestFactory : NSObject

+ (nonnull ABI44_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON;

@end

NS_ASSUME_NONNULL_END
