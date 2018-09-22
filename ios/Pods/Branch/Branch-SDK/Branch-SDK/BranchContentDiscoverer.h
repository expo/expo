//
//  ContentDiscoverer.h
//  Branch-TestBed
//
//  Created by Sojan P.R. on 8/17/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import "BranchContentDiscoveryManifest.h"

@interface BranchContentDiscoverer : NSObject

+ (BranchContentDiscoverer *)getInstance;
- (void) startDiscoveryTaskWithManifest:(BranchContentDiscoveryManifest*)manifest;
- (void) startDiscoveryTask;
- (void) stopDiscoveryTask;

@property (nonatomic, strong) BranchContentDiscoveryManifest* contentManifest;
@end
