//
//  EXOtaConfig.m
//  EXOta
//
//  Created by Michał Czernek on 18/09/2019.
//

#import "EXExpoUpdatesConfig.h"
#import "EXVersionNumberManifestComparator.h"
#import "EXExpoPublicKeyManifestValidator.h"
#import "EXSdkVersionComparator.h"
#import "EXEmbeddedManifestAndBundle.h"
#import "EXCommitTimeManifestComparator.h"
#import "EXRevisionIdManifestComparator.h"

@implementation EXExpoUpdatesConfigBuilder

- (id) init
{
  _releaseChannel = @"default";
  _sdkVersion = @"34.0.0";
  _apiVersion = 1;
  _manifestTimeout = 60 * 1000;
  _manifestComparator = [[EXVersionNumberManifestComparator alloc] initWithNativeComparator:[EXSdkVersionComparator new]];
  _manifestValidator = [[EXExpoPublicKeyManifestValidator alloc] initWithPublicKeyUrl:@"https://exp.host/--/manifest-public-key" andTimeout:60 * 1000];
  _bundleTimeout = 2 * 60 * 1000;
  _checkForUpdatesAutomatically = YES;
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
@synthesize manifestValidator = _manifestValidator;
@synthesize checkForUpdatesAutomatically = _checkForUpdatesAutomatically;

- (id)initWithEmbeddedManifest
{
  NSDictionary *embeddedManifest = [[EXEmbeddedManifestAndBundle new] readManifest];
  return [self initWithManifest:embeddedManifest];
}

- (id)initWithManifest:(NSDictionary *)manifest
{
  NSString *releaseChannel = manifest[@"releaseChannel"];
  NSString *sdkVersion = manifest[@"sdkVersion"];
  NSDictionary *updatesConfig = manifest[@"updates"];
  _checkForUpdatesAutomatically = YES;
  _manifestComparator = [self defaultManifestComparator];
  
  if (updatesConfig != nil)
  {
    _checkForUpdatesAutomatically = ![@"ON_ERROR_RECOVERY" isEqualToString:updatesConfig[@"checkAutomatically"]];
    NSString *manifestComparatorValue = updatesConfig[@"versionComparison"];
    _manifestComparator = [self manifestComparatorByComparisonValue:manifestComparatorValue];
  }
  
  _manifestUrl = [NSString stringWithFormat:@"https://%@", manifest[@"hostUri"]];
  _manifestRequestHeaders = [self expoRequestHeadersForChannel:releaseChannel sdkVersion:sdkVersion apiVersion:1];
  _manifestRequestTimeout = 60 * 1000;
  _bundleRequestTimeout = 2 * 60 * 1000;
  _channelIdentifier = releaseChannel;
  _manifestValidator = [[EXExpoPublicKeyManifestValidator alloc] initWithPublicKeyUrl:@"https://exp.host/--/manifest-public-key" andTimeout:60 * 1000];
  
  return self;
}

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
          withManifestValidator:builder.manifestValidator
              withBundleTimeout:builder.bundleTimeout
withCheckForUpdatesAutomatically:builder.checkForUpdatesAutomatically];
}

- initWithUsername:(NSString *)username
   withProjectName:(NSString *)projectName
withReleaseChannel:(NSString *)channel
withExpoSdkVersion:(NSString *)sdkVersion
    withApiVersion:(NSInteger)apiVersion
withManifestTimeout:(NSInteger)manifestTimeout
withManifestComparator:(id<ManifestComparator>)manifestComparator
withManifestValidator:(id<ManifestResponseValidator>)manifestValidator
 withBundleTimeout:(NSInteger)bundleTimeout
withCheckForUpdatesAutomatically:(BOOL)checkForUpdatesAutomatically
{
  if([username length] == 0 || [projectName length] == 0) {
    @throw (@"You must define username and project!");
  } else {
    _manifestUrl = [NSString stringWithFormat:@"https://exp.host/@%@/%@", username, projectName];
    _manifestRequestHeaders = [self expoRequestHeadersForChannel:channel sdkVersion:sdkVersion apiVersion:apiVersion];
    _manifestRequestTimeout = manifestTimeout;
    _bundleRequestTimeout = bundleTimeout;
    _channelIdentifier = channel;
    _manifestComparator = manifestComparator;
    _manifestValidator = manifestValidator;
    _checkForUpdatesAutomatically = checkForUpdatesAutomatically;
    return self;
  }
}

- (NSDictionary *)expoRequestHeadersForChannel:(NSString *)channel sdkVersion:(NSString *)sdkVersion apiVersion:(NSInteger )apiVersion
{
  return @{
    @"Accept": @"application/expo+json,application/json",
    @"Exponent-SDK-Version": sdkVersion,
    @"Expo-Api-Version": [@(apiVersion) stringValue],
    @"Expo-Release-Channel": channel,
    @"Exponent-Accept-Signature": @"true",
    @"Exponent-Platform": @"ios"
  };
}

- (id<ManifestComparator>)manifestComparatorByComparisonValue:(NSString *)manifestComparisonValue
{
  if([@"VERSION" isEqualToString:manifestComparisonValue]) {
    return [[EXVersionNumberManifestComparator alloc] initWithNativeComparator:[EXSdkVersionComparator new]];
  }  else if([@"NEWEST" isEqualToString:manifestComparisonValue]) {
    return [[EXCommitTimeManifestComparator alloc] initWithNativeComparator:[EXSdkVersionComparator new]];
  } else if([@"REVISION" isEqualToString:manifestComparisonValue]) {
    return [[EXRevisionIdManifestComparator alloc] initWithNativeComparator:[EXSdkVersionComparator new]];
  } else {
    return [self defaultManifestComparator];
  }
}

- (id<ManifestComparator>)defaultManifestComparator
{
  return [[EXCommitTimeManifestComparator alloc] initWithNativeComparator:[EXSdkVersionComparator new]];
}

@end
