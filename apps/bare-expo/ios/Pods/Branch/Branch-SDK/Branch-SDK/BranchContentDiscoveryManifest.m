//
//  ContentDiscoverManifest.m
//  Branch-TestBed
//
//  Created by Sojan P.R. on 8/18/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//


#import "BranchContentDiscoveryManifest.h"
#import "BNCPreferenceHelper.h"
#import "BranchContentPathProperties.h"
#import "BranchConstants.h"


@interface BranchContentDiscoveryManifest ()
@property (nonatomic, strong) NSString *manifestVersion;
@end


@implementation BranchContentDiscoveryManifest

- (instancetype)init {
    self = [super init];
    if (self) {
        NSDictionary *savedManifest = [[BNCPreferenceHelper preferenceHelper] getContentAnalyticsManifest];
        if (savedManifest) {
            _cdManifest = [savedManifest mutableCopy];
        } else {
            _cdManifest = [[NSMutableDictionary alloc] init];
        }
    }
    return self;
}

+ (BranchContentDiscoveryManifest *)getInstance {
    @synchronized (self) {
        static BranchContentDiscoveryManifest *contentDiscoveryManifest = nil;
        if (!contentDiscoveryManifest) {
            contentDiscoveryManifest = [[BranchContentDiscoveryManifest alloc] init];
        }
        return contentDiscoveryManifest;
    }
}

- (void)onBranchInitialised:(NSDictionary *)branchInitDict withUrl:(NSString *)referringURL {
    _referredLink = referringURL;
    if ([branchInitDict objectForKey:BRANCH_CONTENT_DISCOVER_KEY]) {
        _isCDEnabled = YES;
        NSDictionary *cdManifestDict = [branchInitDict objectForKey:BRANCH_CONTENT_DISCOVER_KEY];
        
        if ([cdManifestDict objectForKey:BRANCH_MANIFEST_VERSION_KEY]) {
            _manifestVersion = [cdManifestDict objectForKey:BRANCH_MANIFEST_VERSION_KEY];
            [_cdManifest setObject:_manifestVersion forKey:BRANCH_MANIFEST_VERSION_KEY];
        }
        
        if ([cdManifestDict objectForKey:BRANCH_MAX_VIEW_HISTORY_LENGTH]) {
            _maxViewHistoryLength = [[cdManifestDict objectForKey:BRANCH_MAX_VIEW_HISTORY_LENGTH] integerValue];
        }
        
        if ([cdManifestDict objectForKey:BRANCH_MANIFEST_KEY]) {
            _contentPaths = [cdManifestDict objectForKey:BRANCH_MANIFEST_KEY];
            [_cdManifest setObject:_contentPaths forKey:BRANCH_MANIFEST_KEY];
        }
        
        if ([cdManifestDict objectForKey:BRANCH_MAX_TEXT_LEN_KEY]) {
            _maxTextLen = [[cdManifestDict objectForKey:BRANCH_MAX_TEXT_LEN_KEY] integerValue];
        }
        
        if ([cdManifestDict objectForKey:BRANCH_MAX_PACKET_SIZE_KEY]) {
            _maxPktSize = [[cdManifestDict objectForKey:BRANCH_MAX_PACKET_SIZE_KEY] integerValue];
        }
        
        [[BNCPreferenceHelper preferenceHelper] saveContentAnalyticsManifest:_cdManifest];
    } else {
        _isCDEnabled = NO;
    }
    
}

- (NSString *)getManifestVersion {
    NSString *mVersion = @"-1";
    if (_cdManifest && [_cdManifest objectForKey:BRANCH_MANIFEST_VERSION_KEY]) {
        mVersion = [_cdManifest objectForKey:BRANCH_MANIFEST_VERSION_KEY] ;
    }
    return mVersion;
}

- (BranchContentPathProperties *)getContentPathProperties:(UIViewController *)viewController {
    BranchContentPathProperties *contentPathProperties;
    
    if (_contentPaths) {
        NSString *viewPath = [NSString stringWithFormat:@"/%@", ([viewController class])];
        for (NSDictionary *pathObj in _contentPaths) {
            NSString *pathStr = [pathObj objectForKey:BRANCH_PATH_KEY];
            if (pathStr && [pathStr isEqualToString:viewPath]) {
                contentPathProperties = [[BranchContentPathProperties alloc] init:pathObj];
                break;
            }
        }
    }
    return contentPathProperties;
}



@end
