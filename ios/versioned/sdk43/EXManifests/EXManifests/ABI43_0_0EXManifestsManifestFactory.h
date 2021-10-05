//  Copyright © 2021 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXManifestsManifestFactory : NSObject

+ (nonnull ABI43_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON;

@end

NS_ASSUME_NONNULL_END
