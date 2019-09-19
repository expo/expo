//
//  EXOtaConfig.m
//  EXOta
//
//  Created by Michał Czernek on 18/09/2019.
//

#import "EXExpoManifestRequestConfig.h"

@implementation EXOtaConfigBuilder: NSObject
- (id) init
{
    _releaseChannel = @"default";
    _sdkVersion = @"34.0.0";
    _releaseChannel = @"default";
    _timeout = 30 * 1000;
    return self;
}

@end

@implementation EXExpoManifestRequestConfig

@synthesize manifestUrl = _manifestUrl;
@synthesize manifestRequestHeaders = _manifestRequestHeaders;
@synthesize requestTimeout = _timeout;

- (id)initWithBuilder:(void (^)(EXOtaConfigBuilder *))builderBlock
{
    EXOtaConfigBuilder *builder = [[EXOtaConfigBuilder alloc] init];
    builderBlock(builder);
    return [self initWithUsername:builder.username withProjectName:builder.projectName withReleaseChannel:builder.releaseChannel withExpoSdkVersion:builder.sdkVersion withApiVersion:builder.apiVersion withTimeout:builder.timeout];
}

- (id)initWithUsername:(NSString*)username withProjectName:(NSString*)projectName withReleaseChannel:(NSString*)channel withExpoSdkVersion:(NSString*)sdkVersion withApiVersion:(NSInteger)apiVersion withTimeout:(NSInteger)timeout
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
            @"Exponent-Platform": @"ios"
        };
        _timeout = timeout;
        return self;
    }
}

@end
