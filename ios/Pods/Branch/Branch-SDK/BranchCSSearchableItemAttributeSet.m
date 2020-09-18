//
//  BranchCSSearchableItemAttributeSet.m
//  Branch-TestBed
//
//  Created by Derrick Staten on 9/8/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BranchCSSearchableItemAttributeSet.h"

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"

#import "Branch.h"
#import "BNCSystemObserver.h"

#ifndef kUTTypeGeneric
#define kUTTypeGeneric @"public.content"
#endif

@interface BranchCSSearchableItemAttributeSet()
@property (nonatomic, strong) NSUserActivity *userActivity;
@end

@implementation BranchCSSearchableItemAttributeSet

- (instancetype)init {
    return [self initWithItemContentType:kUTTypeGeneric];
}

#ifdef __IPHONE_14_0
- (instancetype)initWithContentType:(nonnull UTType *)contentType {
    if (self = [super initWithContentType:contentType]) {
        self.publiclyIndexable = YES;
    }
    return self;
}
#endif

- (instancetype)initWithItemContentType:(nonnull NSString *)type {
    if (self = [super initWithItemContentType:type]) {
        self.publiclyIndexable = YES;
    }
    return self;
}

- (void)setIdentifier:(NSString *)identifier {
    if (![identifier hasPrefix:BRANCH_SPOTLIGHT_PREFIX]) {
        BNCLogWarning(@"Do not set BranchCSSearchableItemAttributeSet's identifier. It will be overwritten.");
    }
}

- (void)indexWithCallback:(callbackWithUrlAndSpotlightIdentifier)callback {
    if ([BNCSystemObserver getOSVersion].integerValue < 9) {
        if (callback) {
            callback(nil, nil, [NSError branchErrorWithCode:BNCSpotlightNotAvailableError]);
        }
        return;
    }
    if (![CSSearchableIndex isIndexingAvailable]) {
        if (callback) {
            callback(nil, nil, [NSError branchErrorWithCode:BNCSpotlightNotAvailableError]);
        }
        return;
    }
    if (!self.title) {
        if (callback) {
            callback(nil, nil, [NSError branchErrorWithCode:BNCSpotlightTitleError]);
        }
        return;
    }

    // Include spotlight info in params
    NSMutableDictionary *spotlightLinkData = [[NSMutableDictionary alloc] init];
    spotlightLinkData[BRANCH_LINK_DATA_KEY_TITLE] = self.title;
    spotlightLinkData[BRANCH_LINK_DATA_KEY_PUBLICLY_INDEXABLE] = @(self.publiclyIndexable);
    if (self.contentType) {
        spotlightLinkData[BRANCH_LINK_DATA_KEY_TYPE] = self.contentType;
    }
    
    if (self.params) {
        [spotlightLinkData addEntriesFromDictionary:self.params];
    }
    
    // Default the OG Title, Description, and Image Url if necessary
    if (!spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_TITLE]) {
        spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_TITLE] = self.title;
    }
    
    if (self.contentDescription) {
        spotlightLinkData[BRANCH_LINK_DATA_KEY_DESCRIPTION] = self.contentDescription;
        if (!spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_DESCRIPTION]) {
            spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_DESCRIPTION] = self.contentDescription;
        }
    }
    
    BOOL thumbnailIsRemote = self.thumbnailURL && ![self.thumbnailURL isFileURL];
    if (self.thumbnailURL.absoluteString) {
        spotlightLinkData[BRANCH_LINK_DATA_KEY_THUMBNAIL_URL] = self.thumbnailURL.absoluteString;
        
        // Only use the thumbnail url if it is a remote url, not a file system url
        if (thumbnailIsRemote && !spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_IMAGE_URL]) {
            spotlightLinkData[BRANCH_LINK_DATA_KEY_OG_IMAGE_URL] = self.thumbnailURL.absoluteString;
        }
    }
    
    if (self.keywords) {
        spotlightLinkData[BRANCH_LINK_DATA_KEY_KEYWORDS] = [self.keywords allObjects];
    }
    
    [[Branch getInstance] getSpotlightUrlWithParams:spotlightLinkData callback:^(NSDictionary *data, NSError *urlError) {
        if (urlError) {
            if (callback) {
                callback(nil, nil, urlError);
            }
            return;
        }
        
        if (thumbnailIsRemote && !self.thumbnailData) {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                NSData *thumbnailData = [NSData dataWithContentsOfURL:self.thumbnailURL];
                dispatch_async(dispatch_get_main_queue(), ^{
                    self.thumbnailData = thumbnailData;
                    [self indexContentWithUrl:data[BRANCH_RESPONSE_KEY_URL] spotlightIdentifier:data[BRANCH_RESPONSE_KEY_SPOTLIGHT_IDENTIFIER] callback:callback];
                });
            });
        }
        else {
            [self indexContentWithUrl:data[BRANCH_RESPONSE_KEY_URL] spotlightIdentifier:data[BRANCH_RESPONSE_KEY_SPOTLIGHT_IDENTIFIER] callback:callback];
        }
    }];
}

- (void)indexContentWithUrl:(NSString *)url spotlightIdentifier:(NSString *)spotlightIdentifier callback:(callbackWithUrlAndSpotlightIdentifier)callback {
    self.identifier = spotlightIdentifier;
    self.relatedUniqueIdentifier = spotlightIdentifier;
    self.contentURL = [NSURL URLWithString:url]; // The content url links back to our web content
    
    // Index via the NSUserActivity strategy
    // Currently (iOS 9 Beta 4) we need a strong reference to this, or it isn't indexed
    self.userActivity = [[NSUserActivity alloc] initWithActivityType:spotlightIdentifier];
    self.userActivity.title = self.title;
    self.userActivity.webpageURL = [NSURL URLWithString:url]; // This should allow indexed content to fall back to the web if user doesn't have the app installed. Unable to test as of iOS 9 Beta 4
    self.userActivity.eligibleForSearch = YES;
    self.userActivity.eligibleForPublicIndexing = self.publiclyIndexable;
    self.userActivity.contentAttributeSet = self; // TODO: ensure this does not create a retain cycle
    self.userActivity.userInfo = self.params; // As of iOS 9 Beta 4, this gets lost and never makes it through to application:continueActivity:restorationHandler:
    self.userActivity.requiredUserInfoKeys = [NSSet setWithArray:self.params.allKeys]; // This, however, seems to force the userInfo to come through.
    self.userActivity.keywords = self.keywords;
    [self.userActivity becomeCurrent];
    
    // Index via the CoreSpotlight strategy
    CSSearchableItem *item = [[CSSearchableItem alloc] initWithUniqueIdentifier:spotlightIdentifier domainIdentifier:BRANCH_SPOTLIGHT_PREFIX attributeSet:self];
    [[CSSearchableIndex defaultSearchableIndex] indexSearchableItems:@[ item ] completionHandler:^(NSError *indexError) {
        if (callback) {
            if (indexError) {
                callback(nil, nil, indexError);
            }
            else {
                callback(url, spotlightIdentifier, nil);
            }
        }
    }];
}

@end

#endif
