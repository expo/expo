//
//  BNCFacebookAppLinks.m
//  Branch
//
//  Created by Ernest Cho on 10/24/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCFacebookAppLinks.h"
#import "NSError+Branch.h"

@interface BNCFacebookAppLinks()
@property (nonatomic, strong, readwrite) id appLinkUtility;
@property (nonatomic, assign, readwrite) SEL fetchDeferredAppLink;
@end

@implementation BNCFacebookAppLinks

+ (BNCFacebookAppLinks *)sharedInstance {
    static BNCFacebookAppLinks *singleton;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        singleton = [[BNCFacebookAppLinks alloc] init];
    });
    return singleton;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        self.fetchDeferredAppLink = NSSelectorFromString(@"fetchDeferredAppLink:");
    }
    return self;
}

- (void)registerFacebookDeepLinkingClass:(id)appLinkUtility {
    self.appLinkUtility = appLinkUtility;
}

- (BOOL)isDeepLinkingClassAvailable {
    if (self.appLinkUtility && [self.appLinkUtility respondsToSelector:self.fetchDeferredAppLink]) {
        return YES;
    }
    return NO;
}
 
- (void)fetchFacebookAppLinkWithCompletion:(void (^_Nullable)(NSURL *__nullable appLink, NSError *__nullable error))completion {
    
    if (![self isDeepLinkingClassAvailable]) {
        if (completion) {
            completion(nil, [NSError branchErrorWithCode:BNCGeneralError localizedMessage:@"FB Deeplinking class is not available."]);
        }
        return;
    }
    
     void (^__nullable completionBlock)(NSURL *appLink, NSError *error) = ^void(NSURL *__nullable appLink, NSError *__nullable error) {
         if (completion) {
             if (error) {
                 completion(nil, [NSError branchErrorWithCode:BNCGeneralError error:error]);
             } else {
                 completion(appLink, nil);
             }
         }
     };

    dispatch_async(dispatch_get_main_queue(), ^{
        ((void (*)(id, SEL, void (^ __nullable)(NSURL *__nullable appLink, NSError * __nullable error)))[self.appLinkUtility methodForSelector:self.fetchDeferredAppLink])(self.appLinkUtility, self.fetchDeferredAppLink, completionBlock);
    });
 }

@end
