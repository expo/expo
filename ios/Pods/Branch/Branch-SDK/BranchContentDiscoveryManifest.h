//
//  ContentDiscoverManifest.h
//  Branch-TestBed
//
//  Created by Sojan P.R. on 8/18/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "BranchContentPathProperties.h"

@interface BranchContentDiscoveryManifest : NSObject

@property (strong, nonatomic) NSMutableDictionary *cdManifest;
@property (strong, nonatomic) NSString *referredLink;
@property (nonatomic) NSInteger maxTextLen;
@property (nonatomic) NSInteger maxViewHistoryLength;
@property (nonatomic) NSInteger maxPktSize;
@property (nonatomic) BOOL isCDEnabled;
@property (strong, nonatomic) NSMutableArray *contentPaths;

+ (BranchContentDiscoveryManifest *)getInstance;
- (NSString *)getManifestVersion;
- (BranchContentPathProperties *)getContentPathProperties:(UIViewController *)viewController;
- (void)onBranchInitialised:(NSDictionary *)branchInitDict withUrl:(NSString *)referringURL;
@end
