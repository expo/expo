//
//  BNCSpotlightService.m
//  Branch-SDK
//
//  Created by Parth Kalavadia on 8/10/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "BNCSpotlightService.h"
#import "Branch.h"
#import "BNCSystemObserver.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"

#pragma mark Defensive Declarations

#ifndef CSSearchableItemActivityIdentifier
#define CSSearchableItemActivityIdentifier @"kCSSearchableItemActivityIdentifier"
#endif

@interface CSSearchableItemAttributeSetDummyClass : NSObject
- (void) setKeywords:(NSArray<NSString*>*)keywords;
- (void) setWeakRelatedUniqueIdentifier:(NSString*)uniqueIdentifier;
@end

static NSString* const kUTTypeGeneric = @"public.content";
static NSString* const kDomainIdentifier = @"io.branch.sdk.spotlight";

#pragma mark - BNCSpotlightService

@interface BNCSpotlightService()<NSUserActivityDelegate> {
    dispatch_queue_t    _workQueue;
}
@property (strong, nonatomic) NSMutableDictionary *userInfo;
@property (strong, readonly) dispatch_queue_t workQueue;
@end

#pragma mark - BNCSpotlightService

@implementation BNCSpotlightService

- (void)indexWithBranchUniversalObject:(BranchUniversalObject* _Nonnull)universalObject
                        linkProperties:(BranchLinkProperties* _Nullable)linkProperties
                              callback:(void (^_Nullable)(BranchUniversalObject * _Nullable universalObject,
                                                          NSString* _Nullable url,
                                                          NSError * _Nullable error))completion {
    if ([BNCSystemObserver getOSVersion].floatValue < 9.0) {
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightNotAvailableError];
        if (completion) {
            completion(universalObject,nil,error);
        }
        return;
    }
    if (!universalObject.title) {
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightTitleError];
        if (completion) {
            completion(universalObject,[BNCPreferenceHelper preferenceHelper].userUrl, error);
        }
        return;
    }
    
    BranchLinkProperties* spotlightLinkProperties;
    if (linkProperties == nil) {
        spotlightLinkProperties = [[BranchLinkProperties alloc] init];
    }
    [spotlightLinkProperties setFeature:BNCSpotlightFeature];
    
    NSURL* thumbnailUrl = [NSURL URLWithString:universalObject.imageUrl];
    BOOL thumbnailIsRemote = thumbnailUrl && ![thumbnailUrl isFileURL];
    
    if (thumbnailIsRemote) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            NSData *thumbnailData = [NSData dataWithContentsOfURL:thumbnailUrl];
            dispatch_async(dispatch_get_main_queue(), ^{
                
                [self indexContentWithBranchUniversalObject:universalObject
                                               linkProperty:linkProperties
                                               thumbnailUrl:thumbnailUrl
                                              thumbnailData:thumbnailData
                                                   callback:^(NSString * _Nullable url, NSError * _Nullable error) {
                                                       if (completion)
                                                           completion(universalObject,url,error);
                                                   }];
            });
        });
    }
    else {
        [self indexContentWithBranchUniversalObject:universalObject
                                       linkProperty:linkProperties
                                       thumbnailUrl:thumbnailUrl
                                      thumbnailData:nil
                                           callback:^(NSString * _Nullable url, NSError * _Nullable error) {
                                               if (completion)
                                                   completion(universalObject,url,error);
                                           }];
    }
}

- (void)indexContentWithBranchUniversalObject:(BranchUniversalObject*)universalObject
                                 linkProperty:(BranchLinkProperties *)linkProperty
                                 thumbnailUrl:(NSURL *)thumbnailUrl
                                thumbnailData:(NSData *)thumbnailData
                                     callback:(void (^_Nullable)(NSString* _Nullable url, NSError * _Nullable error))completion {

    if (!linkProperty) {
        linkProperty = [[BranchLinkProperties alloc] init];
        linkProperty.channel = @"Spotlight Search";
    }

    if (universalObject.locallyIndex) {
        NSString *dynamicUrl = [universalObject getLongUrlWithChannel:nil
                                                              andTags:nil
                                                           andFeature:BNCSpotlightFeature
                                                             andStage:nil
                                                             andAlias:nil];
        
        id attributes = [self attributeSetWithUniversalObject:universalObject
                                                    thumbnail:thumbnailData
                                                          url:dynamicUrl];
        NSDictionary *indexingParams = @{@"title": universalObject.title,
                                         @"url": dynamicUrl,
                                         @"spotlightId": dynamicUrl,
                                         @"userInfo": [universalObject.contentMetadata.customMetadata mutableCopy],
                                         @"keywords": [NSSet setWithArray:universalObject.keywords],
                                         @"attributeSet": attributes
                                         };
        
        [self indexUsingSearchableItem:indexingParams
                         thumbnailData:thumbnailData
                              callback:^(NSString * _Nullable url, NSError * _Nullable error) {
                                  if (completion)
                                      completion(url,error);
                              }];
        
    } else {

        __weak __typeof(self) weakSelf = self;
        [universalObject getShortUrlWithLinkProperties:linkProperty
            andCallback:^(NSString * _Nullable url, NSError * _Nullable error) {
                __strong __typeof(self) strongSelf = weakSelf;
                if (!strongSelf || !url || error) {
                    if (completion) completion([BNCPreferenceHelper preferenceHelper].userUrl, error);
                    return;
                }
            id attributes =
                [strongSelf attributeSetWithUniversalObject:universalObject thumbnail:thumbnailData url:url];
            NSMutableDictionary *indexingParams = [NSMutableDictionary new];
            indexingParams[@"title"] = universalObject.title;
            indexingParams[@"url"] = url;
            indexingParams[@"spotlightId"] = url;
            indexingParams[@"userInfo"] = [universalObject.contentMetadata.customMetadata mutableCopy];
            indexingParams[@"keywords"] = [NSSet setWithArray:universalObject.keywords];
            indexingParams[@"attributeSet"] = attributes;
            [self indexUsingNSUserActivity:indexingParams];
            if (completion) completion(url, nil);
            }
        ];

    }
}

- (id)attributeSetWithUniversalObject:(BranchUniversalObject*)universalObject
                            thumbnail:(NSData*)thumbnailData
                                  url:(NSString*)url {

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
    NSString *type = universalObject.contentMetadata.contentSchema ?: (NSString *)kUTTypeGeneric;
    
    id CSSearchableItemAttributeSetClass = NSClassFromString(@"CSSearchableItemAttributeSet");
    if (!CSSearchableItemAttributeSetClass)
        return nil;
    
    id attributes = [CSSearchableItemAttributeSetClass alloc];
    if (!attributes || ![attributes respondsToSelector:@selector(initWithItemContentType:)])
        return nil;
    attributes = [attributes initWithItemContentType:type];

    #define safePerformSelector(_selector, parameter) { \
        if (parameter != nil && [attributes respondsToSelector:@selector(_selector)]) { \
            [attributes _selector parameter]; \
        } \
    }
    
    safePerformSelector(setTitle:, universalObject.title);
    safePerformSelector(setContentDescription:, universalObject.contentDescription);
    NSURL* thumbnailUrl = [NSURL URLWithString:universalObject.imageUrl];
    BOOL thumbnailIsRemote = thumbnailUrl && ![thumbnailUrl isFileURL];
    if (!thumbnailIsRemote) {
        safePerformSelector(setThumbnailURL:, thumbnailUrl);
    }
    safePerformSelector(setThumbnailData:, thumbnailData);
    safePerformSelector(setContentURL:, [NSURL URLWithString:url]);
    if (universalObject.keywords && [attributes respondsToSelector:@selector(setKeywords:)])
        [((CSSearchableItemAttributeSetDummyClass*)attributes) setKeywords:universalObject.keywords];
    safePerformSelector(setWeakRelatedUniqueIdentifier:, universalObject.canonicalIdentifier);
    
    #undef safePerformSelector

    return attributes;

#else

    return nil;

#endif
}

- (void)indexPrivatelyWithBranchUniversalObjects:(NSArray<BranchUniversalObject*>* _Nonnull)universalObjects
                                      completion:(void (^_Nullable) (NSArray<BranchUniversalObject *> * _Nullable universalObjects,
                                                                     NSError * _Nullable error))completion {
    BOOL isIndexingAvailable = NO;
    Class CSSearchableIndexClass = NSClassFromString(@"CSSearchableIndex");
    Class CSSearchableItemClass = NSClassFromString(@"CSSearchableItem");
    SEL isIndexingAvailableSelector = NSSelectorFromString(@"isIndexingAvailable");
    isIndexingAvailable =
    ((BOOL (*)(id, SEL))[CSSearchableIndexClass methodForSelector:isIndexingAvailableSelector])
    (CSSearchableIndexClass, isIndexingAvailableSelector);
    
    #define IndexingNotAvailable() { \
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightNotAvailableError];\
        if (completion) {\
            completion(nil,error);\
        }\
        return;\
    }
    
    if (!isIndexingAvailable ||
        !CSSearchableIndexClass ||
        ![CSSearchableIndexClass respondsToSelector:@selector(defaultSearchableIndex)] ||
        !CSSearchableItemClass) {
        IndexingNotAvailable();
    }
    dispatch_group_t workGroup = dispatch_group_create();
    NSMutableArray<CSSearchableItem *> *searchableItems = [[NSMutableArray alloc] init];
    NSMutableDictionary<NSString*,BranchUniversalObject*> *mapSpotlightIdentifier =
    [[NSMutableDictionary alloc] init];
    
    for (BranchUniversalObject* universalObject in universalObjects) {
        dispatch_group_enter(workGroup);
        NSString* dynamicUrl = [universalObject getLongUrlWithChannel:nil
                                                              andTags:nil
                                                           andFeature:BNCSpotlightFeature
                                                             andStage:nil andAlias:nil];
        if (!dynamicUrl) continue;
        mapSpotlightIdentifier[dynamicUrl] = universalObject;
        NSURL* thumbnailUrl = [NSURL URLWithString:universalObject.imageUrl];
        BOOL thumbnailIsRemote = thumbnailUrl && ![thumbnailUrl isFileURL];
        if (thumbnailIsRemote) {
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                NSData *thumbnailData = [NSData dataWithContentsOfURL:thumbnailUrl];
                dispatch_async(dispatch_get_main_queue(), ^{
                    
                    id attributes = [self attributeSetWithUniversalObject:universalObject
                                                                thumbnail:thumbnailData
                                                                      url:dynamicUrl];
                    
                    id item = [CSSearchableItemClass alloc];
                    item = [item initWithUniqueIdentifier:dynamicUrl
                                         domainIdentifier:kDomainIdentifier
                                             attributeSet:attributes];
                    
                    [searchableItems addObject:item];
                    dispatch_group_leave(workGroup);
                });
            });
        }
        else {
            id attributes =  [self attributeSetWithUniversalObject:universalObject
                                                         thumbnail:nil
                                                               url:dynamicUrl];
            id item = [CSSearchableItemClass alloc];
            item = [item initWithUniqueIdentifier:dynamicUrl
                                 domainIdentifier:kDomainIdentifier
                                     attributeSet:attributes];
            
            [searchableItems addObject:item];
            dispatch_group_leave(workGroup);
        }
    }
    
    dispatch_group_notify(workGroup, dispatch_get_main_queue(), ^{
        id index = [CSSearchableIndexClass defaultSearchableIndex];
        
        if (![index respondsToSelector:@selector(indexSearchableItems:completionHandler:)]) {
            IndexingNotAvailable();
        }
        
        [index indexSearchableItems:searchableItems completionHandler:^(NSError * _Nullable error) {
            if (!error) {
                if (completion)
                    completion(universalObjects,nil);
            }
            else {
                if (completion)
                    completion(nil,error);
            }
            
        }];
    });
    #undef IndexingNotAvailable
}

- (dispatch_queue_t) workQueue {
    @synchronized (self) {
        if (!_workQueue)
            _workQueue = dispatch_queue_create("io.branch.sdk.spotlight.indexing", DISPATCH_QUEUE_CONCURRENT);
        return _workQueue;
    }
}

- (void)indexUsingNSUserActivity:(NSDictionary *)params {
    self.userInfo = params[@"userInfo"];
    self.userInfo[CSSearchableItemActivityIdentifier] = params[@"spotlightId"];
    UIViewController *activeViewController = [UIViewController bnc_currentViewController];
    if (!activeViewController) {
        // if no view controller, don't index. Current use case: iMessage extensions
        return;
    }
    NSString *uniqueIdentifier = [NSString stringWithFormat:@"io.branch.%@", [[NSBundle mainBundle] bundleIdentifier]];
    // Can't create any weak references here to the userActivity, otherwise it will not index.
    activeViewController.userActivity = [[NSUserActivity alloc] initWithActivityType:uniqueIdentifier];
    activeViewController.userActivity.delegate = self;
    activeViewController.userActivity.title = params[@"title"];
    activeViewController.userActivity.webpageURL = [NSURL URLWithString:params[@"url"]];
    activeViewController.userActivity.eligibleForSearch = YES;
    activeViewController.userActivity.eligibleForPublicIndexing = YES;  // TODO: Update with the new indexPublically.
    activeViewController.userActivity.userInfo = self.userInfo; // This alone doesn't pass userInfo through
    activeViewController.userActivity.requiredUserInfoKeys = [NSSet setWithArray:self.userInfo.allKeys]; // This along with the delegate method userActivityWillSave, however, seem to force the userInfo to come through.
    activeViewController.userActivity.keywords = params[@"keywords"];
    SEL setContentAttributeSetSelector = NSSelectorFromString(@"setContentAttributeSet:");
    ((void (*)(id, SEL, id))[activeViewController.userActivity methodForSelector:setContentAttributeSetSelector])(activeViewController.userActivity, setContentAttributeSetSelector, params[@"attributeSet"]);
    
    [activeViewController.userActivity becomeCurrent];
    
}

- (void)indexUsingSearchableItem:(NSDictionary*)indexingParam
                   thumbnailData:(NSData*)thumbnailData
                        callback:(void (^_Nullable)(NSString* _Nullable url, NSError * _Nullable error))completion {
    
    BOOL isIndexingAvailable = NO;
    Class CSSearchableIndexClass = NSClassFromString(@"CSSearchableIndex");
    SEL isIndexingAvailableSelector = NSSelectorFromString(@"isIndexingAvailable");
    isIndexingAvailable =
    ((BOOL (*)(id, SEL))[CSSearchableIndexClass methodForSelector:isIndexingAvailableSelector])
    (CSSearchableIndexClass, isIndexingAvailableSelector);
    
    #define IndexingNotAvalable() { \
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightNotAvailableError];\
        if (completion) {\
            completion(nil,error);\
        }\
        return;\
    }
    
    if (!isIndexingAvailable) {
        IndexingNotAvalable();
    }
    
    NSString *dynamicUrl = indexingParam[@"url"];
    Class CSSearchableItemClass = NSClassFromString(@"CSSearchableItem");
    
    if (!CSSearchableItemClass) {
        IndexingNotAvalable();
    }
    
    id item = [CSSearchableItemClass alloc];
    
    if (!item ||
        ![item respondsToSelector:@selector(initWithUniqueIdentifier:domainIdentifier:attributeSet:)]) {
        IndexingNotAvalable();
    }
    
    item = [item initWithUniqueIdentifier:indexingParam[@"url"]
                         domainIdentifier:kDomainIdentifier
                             attributeSet:indexingParam[@"attributeSet"]];
    
    if (CSSearchableIndexClass &&
        [CSSearchableIndexClass respondsToSelector:@selector(defaultSearchableIndex)]){
        id defaultSearchableIndex = [CSSearchableIndexClass defaultSearchableIndex];
        if ([defaultSearchableIndex respondsToSelector:@selector(indexSearchableItems:completionHandler:)]) {
            [defaultSearchableIndex indexSearchableItems:@[item]
                                       completionHandler: ^(NSError * __nullable error) {
                                           NSString *url = error == nil?dynamicUrl:nil;
                                           if (completion) {
                                               completion(url, error);
                                           }
                                       }];
        }
        else {
            IndexingNotAvalable();
        }
    }
    else {
        IndexingNotAvalable();
    }
    #undef IndexingNotAvalable
}

#pragma mark - UserActivity Delegate Methods

- (void)userActivityWillSave:(NSUserActivity *)userActivity {
    [userActivity addUserInfoEntriesFromDictionary:self.userInfo];
}

#pragma remove private content from spotlight indexed using Searchable Item

- (void)removeSearchableItemsWithIdentifier:(NSString * _Nonnull)identifier
                                   callback:(void (^_Nullable)(NSError * _Nullable error))completion {
    if (identifier == nil) {
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightIdentifierError
                                     localizedMessage:@"Spotlight indentifier not available"];
        if (completion) completion(error);
        return;
    }
    [self removeSearchableItemsWithIdentifiers:@[identifier] callback:^(NSError * _Nullable error) {
        if (completion)
            completion(error);
    }];
}

- (void)removeSearchableItemsWithIdentifiers:(NSArray<NSString *> *_Nonnull)identifiers
                                    callback:(void (^_Nullable)(NSError * _Nullable error))completion {
    
    BOOL isIndexingAvailable = NO;
    Class CSSearchableIndexClass = NSClassFromString(@"CSSearchableIndex");
    SEL isIndexingAvailableSelector = NSSelectorFromString(@"isIndexingAvailable");
    isIndexingAvailable =
    ((BOOL (*)(id, SEL))[CSSearchableIndexClass methodForSelector:isIndexingAvailableSelector])
    (CSSearchableIndexClass, isIndexingAvailableSelector);
    
    #define IndexingNotAvalable() { \
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightNotAvailableError];\
        if (completion) {\
            completion(error);\
        }\
        return;\
    }
    
    if (!isIndexingAvailable) {
        IndexingNotAvalable();
    }
    else {
        if (CSSearchableIndexClass &&
            [CSSearchableIndexClass respondsToSelector:@selector(defaultSearchableIndex)]){
            id defaultSearchableIndex = [CSSearchableIndexClass defaultSearchableIndex];
            if ([defaultSearchableIndex respondsToSelector:@selector(deleteSearchableItemsWithIdentifiers:completionHandler:)]) {
                [defaultSearchableIndex deleteSearchableItemsWithIdentifiers:identifiers
                                                           completionHandler:^(NSError * _Nullable error) {
                                                               if (completion)
                                                                   completion(error);
                                                           }];
            }
            else {
                IndexingNotAvalable();
            }
        }
        else {
            IndexingNotAvalable();
        }
    }
    
    #undef IndexingNotAvalable
}

- (void)removeAllBranchSearchableItemsWithCallback:(void (^_Nullable)(NSError * _Nullable error))completion {
    
    BOOL isIndexingAvailable = NO;
    Class CSSearchableIndexClass = NSClassFromString(@"CSSearchableIndex");
    SEL isIndexingAvailableSelector = NSSelectorFromString(@"isIndexingAvailable");
    isIndexingAvailable =
    ((BOOL (*)(id, SEL))[CSSearchableIndexClass methodForSelector:isIndexingAvailableSelector])
    (CSSearchableIndexClass, isIndexingAvailableSelector);
    
    #define IndexingNotAvalable() { \
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightNotAvailableError];\
        if (completion) {\
            completion(error);\
        }\
        return;\
    }
    
    if (!isIndexingAvailable) {
        IndexingNotAvalable();
    }
    else {
        id CSSearchableIndexClass = NSClassFromString(@"CSSearchableIndex");
        if (CSSearchableIndexClass &&
            [CSSearchableIndexClass respondsToSelector:@selector(defaultSearchableIndex)]){
            id defaultSearchableIndex = [CSSearchableIndexClass defaultSearchableIndex];
            if ([defaultSearchableIndex respondsToSelector:
                 @selector(deleteSearchableItemsWithDomainIdentifiers:completionHandler:)]) {
                [defaultSearchableIndex deleteSearchableItemsWithDomainIdentifiers:@[kDomainIdentifier]
                                                                 completionHandler:^(NSError * _Nullable error) {
                                                                     if (completion)
                                                                         completion(error);
                                                                 }];
            }
            else {
                IndexingNotAvalable();
            }
        }
        else {
            IndexingNotAvalable();
        }
    }
    #undef IndexingNotAvalable
}
@end
