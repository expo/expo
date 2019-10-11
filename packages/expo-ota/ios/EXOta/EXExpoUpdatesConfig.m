//
//  EXOtaConfig.m
//  EXOta
//
//  Created by Michał Czernek on 18/09/2019.
//

#import "EXExpoUpdatesConfig.h"
#import "EXVersionNumberManifestComparator.h"

@implementation EXExpoUpdatesConfigBuilder: NSObject
- (id) init
{
    _releaseChannel = @"default";
    _sdkVersion = @"34.0.0";
    _apiVersion = 1;
    _manifestTimeout = 30 * 1000;
    _manifestComparator = [[EXVersionNumberManifestComparator alloc] init];
    _bundleTimeout = 2 * 60 * 1000;
    return self;
}

@end

@implementation EXExpoUpdatesConfig

@synthesize manifestUrl = _manifestUrl;
@synthesize manifestRequestHeaders = _manifestRequestHeaders;
@synthesize manifestRequestTimeout = _manifestRequestTimeout;
@synthesize bundleRequestTimeout = _bundleRequestTimeout;
@synthesize channelIdentifier = _channelIdentifier;
@synthesize manifestComparator = _manifestComparator;

- (id)initWithBuilder:(void (^)(EXExpoUpdatesConfigBuilder *))builderBlock
{
    EXExpoUpdatesConfigBuilder *builder = [[EXExpoUpdatesConfigBuilder alloc] init];
    builderBlock(builder);
    return [self initWithUsername:builder.username
                  withProjectName:builder.projectName
               withReleaseChannel:builder.releaseChannel
               withExpoSdkVersion:builder.sdkVersion
                   withApiVersion:builder.apiVersion
              withManifestTimeout:builder.manifestTimeout
           withManifestComparator:builder.manifestComparator
                withBundleTimeout:builder.bundleTimeout];
}

- initWithUsername:(NSString*)username
   withProjectName:(NSString*)projectName
withReleaseChannel:(NSString*)channel
withExpoSdkVersion:(NSString*)sdkVersion
    withApiVersion:(NSInteger)apiVersion
withManifestTimeout:(NSInteger)manifestTimeout
withManifestComparator:(id<ManifestComparator>)manifestComparator
 withBundleTimeout:(NSInteger)bundleTimeout
{
    if([username length] == 0 || [projectName length] == 0) {
        @throw (@"You must define username and project!");
    } else {
        _manifestUrl = [NSString stringWithFormat:@"https://exp.host/@%@/%@", username, projectName];
        _manifestRequestHeaders = @{
            @"Accept": @"application/expo+json,application/json",
            @"Exponent-SDK-Version": sdkVersion,
            @"Expo-Api-Version": [@(apiVersion) stringValue],
            @"Expo-Release-Channel": channel,
            @"Exponent-Accept-Signature": @"true",
            @"Exponent-Platform": @"ios"
        };
        _manifestRequestTimeout = manifestTimeout;
        _bundleRequestTimeout = bundleTimeout;
        _channelIdentifier = channel;
        _manifestComparator = manifestComparator;
        return self;
    }
}

@end
