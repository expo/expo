//
//  BNCCallbacks.h
//  Branch-TestBed
//
//  Created by Ahmed Nawar on 6/18/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@class BranchUniversalObject, BranchLinkProperties;

typedef void (^callbackWithParams) (NSDictionary * _Nullable params, NSError * _Nullable error);
typedef void (^callbackWithUrl) (NSString * _Nullable url, NSError * _Nullable error);
typedef void (^callbackWithStatus) (BOOL changed, NSError * _Nullable error);
typedef void (^callbackWithList) (NSArray * _Nullable list, NSError * _Nullable error);
typedef void (^callbackWithUrlAndSpotlightIdentifier) (NSString * _Nullable url, NSString * _Nullable spotlightIdentifier, NSError * _Nullable error);
typedef void (^callbackWithBranchUniversalObject) (BranchUniversalObject * _Nullable universalObject, BranchLinkProperties * _Nullable linkProperties, NSError * _Nullable error);
