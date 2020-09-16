//
//  BNCAppleAdClient.m
//  Branch
//
//  Created by Ernest Cho on 11/7/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCAppleAdClient.h"
#import "NSError+Branch.h"

@interface BNCAppleAdClient()

@property (nonatomic, strong, readwrite) Class adClientClass;
@property (nonatomic, assign, readwrite) SEL adClientSharedClient;
@property (nonatomic, assign, readwrite) SEL adClientRequestAttribution;

@property (nonatomic, strong, readwrite) id adClient;

@end

// ADClient facade that uses reflection to detect and make it available
@implementation BNCAppleAdClient

- (instancetype)init {
    self = [super init];
    if (self) {
        self.adClientClass = NSClassFromString(@"ADClient");
        self.adClientSharedClient = NSSelectorFromString(@"sharedClient");
        self.adClientRequestAttribution = NSSelectorFromString(@"requestAttributionDetailsWithBlock:");
        
        self.adClient = [self loadAdClient];
    }
    return self;
}

- (id)loadAdClient {
    if ([self isAdClientAvailable]) {
        return ((id (*)(id, SEL))[self.adClientClass methodForSelector:self.adClientSharedClient])(self.adClientClass, self.adClientSharedClient);
    }
    return nil;
}

- (BOOL)isAdClientAvailable {
    BOOL ADClientIsAvailable = self.adClientClass &&
        [self.adClientClass instancesRespondToSelector:self.adClientRequestAttribution] &&
        [self.adClientClass methodForSelector:self.adClientSharedClient];

    if (ADClientIsAvailable) {
        return YES;
    }
    return NO;
}

- (void)requestAttributionDetailsWithBlock:(void (^)(NSDictionary<NSString *,NSObject *> *attributionDetails, NSError *error))completionHandler {
    if (self.adClient) {
        ((void (*)(id, SEL, void (^ __nullable)(NSDictionary *__nullable attrDetails, NSError * __nullable error)))
        [self.adClient methodForSelector:self.adClientRequestAttribution])
        (self.adClient, self.adClientRequestAttribution, completionHandler);
    } else {
        if (completionHandler) {
            completionHandler(nil, [NSError branchErrorWithCode:BNCGeneralError localizedMessage:@"ADClient is not available. Requires iAD.framework and iOS 10+"]);
        }
    }
}

@end
