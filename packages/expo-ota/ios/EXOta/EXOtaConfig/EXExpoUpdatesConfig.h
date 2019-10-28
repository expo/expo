//
//  EXOtaConfig.h
//  EXOta
//
//  Created by Michał Czernek on 18/09/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaUpdater.h"
#import "EXOta.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXExpoUpdatesConfigBuilder: NSObject

@property (nonatomic, copy) NSString *username;
@property (nonatomic, copy) NSString *projectName;
@property (nonatomic, copy) NSString *releaseChannel;
@property (nonatomic, copy) NSString *sdkVersion;
@property (nonatomic) NSInteger apiVersion;
@property (nonatomic) NSInteger manifestTimeout;
@property (nonatomic) id<ManifestComparator> manifestComparator;
@property (nonatomic) id<ManifestResponseValidator> manifestValidator;
@property (nonatomic) NSInteger bundleTimeout;
@property (nonatomic) Boolean checkForUpdatesAutomatically;

@end

@interface EXExpoUpdatesConfig : NSObject<EXOtaConfig>

- (id)initWithEmbeddedManifest;
- (id)initWithManifest:(NSDictionary *)manifest;
- (id)initWithBuilder:(void (^)(EXExpoUpdatesConfigBuilder *))builderBlock;
- (id)initWithUsername:(NSString*)username
       withProjectName:(NSString*)projectName
    withReleaseChannel:(NSString*)channel
    withExpoSdkVersion:(NSString*)sdkVersion
        withApiVersion:(NSInteger)apiVersion
   withManifestTimeout:(NSInteger)manifestTimeout
withManifestComparator:(id<ManifestComparator>)manifestComparator
 withManifestValidator:(id<ManifestResponseValidator>)manifestValidator
     withBundleTimeout:(NSInteger)bundleTimeout
withCheckForUpdatesAutomatically:(Boolean)checkForUpdatesAutomatically;

@end

NS_ASSUME_NONNULL_END
