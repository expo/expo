//
//  BNCContentDiscoveryManager.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 7/17/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif
#import "BNCCallbacks.h"

@interface BNCContentDiscoveryManager : NSObject<NSUserActivityDelegate>

- (NSString *)spotlightIdentifierFromActivity:(NSUserActivity *)userActivity;
- (NSString *)standardSpotlightIdentifierFromActivity:(NSUserActivity *)userActivity;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords userInfo:(NSDictionary *)userInfo;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable thumbnailUrl:(NSURL *)thumbnailUrl userInfo:(NSDictionary *)userInfo;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords userInfo:(NSDictionary *)userInfo;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords userInfo:(NSDictionary *)userInfo callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords userInfo:(NSDictionary *)userInfo expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback;

- (void)indexContentWithTitle:(NSString *)title description:(NSString *)description canonicalId:(NSString *)canonicalId publiclyIndexable:(BOOL)publiclyIndexable type:(NSString *)type thumbnailUrl:(NSURL *)thumbnailUrl keywords:(NSSet *)keywords userInfo:(NSDictionary *)userInfo expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback;


/* This one has a different callback, which includes the spotlightIdentifier, and requires a different signature
    It cannot be part of the stack of method signatures above, because of the different callback type.*/
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
            spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback;

@end
