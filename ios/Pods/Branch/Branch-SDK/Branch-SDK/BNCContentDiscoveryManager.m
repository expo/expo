//
//  BNCContentDiscoveryManager.m
//  Branch-TestBed
//
//  Created by Graham Mueller on 7/17/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BNCContentDiscoveryManager.h"
#import "Branch.h"
#import "BranchConstants.h"
#import "BNCSpotlightService.h"

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
    #if __has_feature(modules)
    @import MobileCoreServices;
    #else
    #import <MobileCoreServices/MobileCoreServices.h>
    #endif
#endif

static NSString* const kUTTypeGeneric = @"public.content";

#ifndef CSSearchableItemActivityIdentifier
#define CSSearchableItemActivityIdentifier @"kCSSearchableItemActivityIdentifier"
#endif

@interface BNCContentDiscoveryManager (){
    dispatch_queue_t    _workQueue;
}

@property (strong, readonly) dispatch_queue_t workQueue;
@property (strong, atomic) BNCSpotlightService* spotlight;

@end

@implementation BNCContentDiscoveryManager


- (id) init {
    self = [super init];
    
    if (self) {
        self.spotlight = [[BNCSpotlightService alloc] init];
    }
    return self;
}

#pragma mark - Launch handling

- (NSString *)spotlightIdentifierFromActivity:(NSUserActivity *)userActivity {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
    // If it has our prefix, then the link identifier is just the last piece of the identifier.
    NSString *activityIdentifier = userActivity.userInfo[CSSearchableItemActivityIdentifier];
    BOOL isBranchIdentifier = [activityIdentifier hasPrefix:BRANCH_SPOTLIGHT_PREFIX];
    if (isBranchIdentifier) {
        return activityIdentifier;
    }
#endif
    
    return nil;
}

- (NSString *)standardSpotlightIdentifierFromActivity:(NSUserActivity *)userActivity {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
    if (userActivity.userInfo[CSSearchableItemActivityIdentifier]) {
        return userActivity.userInfo[CSSearchableItemActivityIdentifier];
    }
#endif
    
    return nil;
}

#pragma mark - Content Indexing

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:NO
                           type:(NSString *)kUTTypeGeneric
                   thumbnailUrl:nil
                       keywords:nil
                       userInfo:nil
                 expirationDate:nil
                       callback:NULL];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:NO
                           type:(NSString *)kUTTypeGeneric
                   thumbnailUrl:nil
                       keywords:nil
                       userInfo:nil
                 expirationDate:nil
                       callback:callback];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:(NSString *)kUTTypeGeneric
                   thumbnailUrl:nil
                       keywords:nil userInfo:nil
                 expirationDate:nil
                       callback:callback];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:nil
                       keywords:nil
                       userInfo:nil
                 expirationDate:nil
                       callback: callback];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:nil
                       userInfo:nil
                 expirationDate:nil
                       callback:callback];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:nil
                 expirationDate:nil
                       callback:callback];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:nil
                 expirationDate:nil
                       callback:NULL];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:NULL];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     userInfo:(NSDictionary *)userInfo {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:kUTTypeGeneric
                   thumbnailUrl:thumbnailUrl
                       keywords:nil
                       userInfo:userInfo
                 expirationDate:nil
                       callback:NULL];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo {
    [self indexContentWithTitle:title
                    description:description
              publiclyIndexable:publiclyIndexable
                           type:kUTTypeGeneric
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:NULL];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo
               expirationDate:(NSDate*)expirationDate
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
                    canonicalId:nil
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:callback
              spotlightCallback:nil];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
                  canonicalId:(NSString *)canonicalId
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo
               expirationDate:(NSDate*)expirationDate
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
                    canonicalId:canonicalId
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:callback
              spotlightCallback:nil];
}


- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo
                     callback:(callbackWithUrl)callback {
    [self indexContentWithTitle:title
                    description:description
                    canonicalId:nil
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:callback
              spotlightCallback:nil];
}

- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo
            spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback {
    [self indexContentWithTitle:title
                    description:description
                    canonicalId:nil
              publiclyIndexable:publiclyIndexable
                           type:type
                   thumbnailUrl:thumbnailUrl
                       keywords:keywords
                       userInfo:userInfo
                 expirationDate:nil
                       callback:nil
              spotlightCallback:spotlightCallback];
}

-(void) indexObject:(BranchUniversalObject *)universalObject
       onCompletion:(void (^)(BranchUniversalObject *, NSString*, NSError *))completion {
    
    [self indexContentWithTitle:universalObject.title
                    description:universalObject.description
                    canonicalId:universalObject.canonicalUrl
              publiclyIndexable:universalObject.locallyIndex
                           type:universalObject.contentMetadata.contentSchema
                   thumbnailUrl:[NSURL URLWithString: universalObject.imageUrl]
                       keywords:[NSSet setWithArray:universalObject.keywords]
                       userInfo:universalObject.contentMetadata.customMetadata expirationDate:nil
                       callback:nil
              spotlightCallback:^(NSString * _Nullable url, NSString * _Nullable spotlightIdentifier, NSError * _Nullable error) {
                  
                  if (error) {
                      completion(universalObject,url,error);
                  } else {
                      completion(universalObject,url,error);
                  }
              }];
}

//This is the final one, which figures out which callback to use, if any
// The simpler callbackWithURL overrides spotlightCallback, so don't send both
- (void)indexContentWithTitle:(NSString *)title
                  description:(NSString *)description
                  canonicalId:(NSString *)canonicalId
            publiclyIndexable:(BOOL)publiclyIndexable
                         type:(NSString *)type
                 thumbnailUrl:(NSURL *)thumbnailUrl
                     keywords:(NSSet *)keywords
                     userInfo:(NSDictionary *)userInfo
               expirationDate:(NSDate *)expirationDate
                     callback:(callbackWithUrl)callback
            spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback {

    if (!userInfo) userInfo = @{};
    NSMutableDictionary *customData = [NSMutableDictionary dictionaryWithDictionary:userInfo];
    if (!customData) customData = [NSMutableDictionary dictionaryWithDictionary:@{}];

    BNCSpotlightService* spotlightService = [[BNCSpotlightService alloc] init];
    
    BranchUniversalObject *universalObject = [[BranchUniversalObject alloc] initWithTitle:title];
    [universalObject setContentDescription:description];
    [universalObject setCanonicalUrl:canonicalId];
    [universalObject setLocallyIndex:publiclyIndexable];
    [universalObject.contentMetadata setContentSchema:type];
    [universalObject setImageUrl:[thumbnailUrl absoluteString]];
    [universalObject setKeywords:[keywords allObjects]];
    [universalObject.contentMetadata setCustomMetadata:customData];
    [universalObject setExpirationDate:expirationDate];
    
    if(publiclyIndexable) {
        [spotlightService indexWithBranchUniversalObject:universalObject
                                          linkProperties:nil
                                                callback:^(BranchUniversalObject * _Nullable universalObject,
                                                           NSString * _Nullable url,
                                                           NSError * _Nullable error) {
                                                    if (callback) {
                                                        callback(url, error);
                                                    }
                                                    else if (spotlightCallback) {
                                                        spotlightCallback(url, url, error);
                                                    }
                                                }];
        
    } else {
        [spotlightService indexWithBranchUniversalObject:universalObject
                                          linkProperties:nil
                                                callback:^(BranchUniversalObject * _Nullable universalObject,
                                                           NSString * _Nullable url,
                                                           NSError * _Nullable error) {
                                                    if (callback) {
                                                        callback(url, error);
                                                    }
                                                    else if (spotlightCallback) {
                                                        spotlightCallback(url, url, error);
                                                    }
                                                }];
    }
}

@end
