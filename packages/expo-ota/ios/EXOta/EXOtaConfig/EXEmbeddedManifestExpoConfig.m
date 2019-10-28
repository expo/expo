//
//  EXEmbeddedManifestExpoConfig.m
//  EXOta
//
//  Created by Michał Czernek on 25/10/2019.
//

#import "EXEmbeddedManifestExpoConfig.h"

@implementation EXEmbeddedManifestExpoConfig

@synthesize manifestUrl = _manifestUrl;
@synthesize manifestRequestHeaders = _manifestRequestHeaders;
@synthesize manifestRequestTimeout = _manifestRequestTimeout;
@synthesize bundleRequestTimeout = _bundleRequestTimeout;
@synthesize channelIdentifier = _channelIdentifier;
@synthesize manifestComparator = _manifestComparator;
@synthesize manifestValidator = _manifestValidator;

@end
