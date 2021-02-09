//
//  ContentDiscoverer.m
//  Branch-TestBed
//
//  Created by Sojan P.R. on 8/17/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#import <CommonCrypto/CommonDigest.h>
#import "BranchContentDiscoverer.h"
#import "BranchContentDiscoveryManifest.h"
#import "BranchContentPathProperties.h"
#import "BNCPreferenceHelper.h"
#import "BranchConstants.h"
#import "BNCEncodingUtils.h"
#import "BNCLog.h"
#import "UIViewController+Branch.h"

@interface BranchContentDiscoverer ()
@property (nonatomic, strong) NSString *lastViewControllerName;
@property (nonatomic, strong) NSTimer *contentDiscoveryTimer;
@property (nonatomic) NSInteger numOfViewsDiscovered;
@end


@implementation BranchContentDiscoverer

+ (BranchContentDiscoverer *)getInstance {
    static BranchContentDiscoverer *sharedInstance = nil;
    @synchronized (self) {
        if (!sharedInstance) {
            sharedInstance = [[BranchContentDiscoverer alloc] init];
        }
    return sharedInstance;
    }
}

- (void) dealloc {
    [_contentDiscoveryTimer invalidate];
}

- (void) setContentManifest:(BranchContentDiscoveryManifest*)manifest {
    _numOfViewsDiscovered = 0;
    _contentManifest = manifest;
}

- (void) startDiscoveryTaskWithManifest:(BranchContentDiscoveryManifest*)manifest {
    self.contentManifest = manifest;
    [self startDiscoveryTask];
}

- (void)startDiscoveryTask {
    if (![NSThread isMainThread]) {
        BNCLogError(@"Discovery should be called on main thread.");
    }
    [_contentDiscoveryTimer invalidate];
    _contentDiscoveryTimer =
        [NSTimer scheduledTimerWithTimeInterval:1.0
            target:self
            selector:@selector(readContentDataIfNeeded)
            userInfo:nil
            repeats:YES];
}

- (void)stopDiscoveryTask {
    _lastViewControllerName = nil;
    if (_contentDiscoveryTimer) {
        [_contentDiscoveryTimer invalidate];
        _contentDiscoveryTimer = nil;
    }
}

- (void)readContentDataIfNeeded {
    if (_numOfViewsDiscovered < self.contentManifest.maxViewHistoryLength) {
        UIViewController *presentingViewController = [UIViewController bnc_currentViewController];
        if (presentingViewController) {
            NSString *presentingViewControllerName = NSStringFromClass([presentingViewController class]);
            if (_lastViewControllerName == nil || ![_lastViewControllerName isEqualToString:presentingViewControllerName]) {
                _lastViewControllerName = presentingViewControllerName;
                [self readContentData:presentingViewController];
            }
        }
    } else {
        [self stopDiscoveryTask];
    }
}

- (void)readContentData:(UIViewController *)viewController {
    if (viewController) {
        UIView *rootView = [self getRootView:viewController];
        NSMutableArray *contentDataArray = [[NSMutableArray alloc] init];
        NSMutableArray *contentKeysArray = [[NSMutableArray alloc] init];
        BOOL isClearText = YES;
        
        if (rootView) {
            BranchContentPathProperties *pathProperties = [self.contentManifest getContentPathProperties:viewController];
            // Check for any existing path properties for this ViewController
            if (pathProperties) {
                isClearText = pathProperties.isClearText;
                if (!pathProperties.isSkipContentDiscovery) {
                    NSArray *filteredKeys = [pathProperties getFilteredElements];
                    if (filteredKeys == nil || filteredKeys.count == 0) {
                        [self discoverViewContents:rootView contentData:nil contentKeys:contentKeysArray clearText:isClearText ID:@""];
                    } else {
                        contentKeysArray = filteredKeys.mutableCopy;
                        [self discoverFilteredViewContents:viewController contentData:contentDataArray contentKeys:contentKeysArray clearText:isClearText];
                    }
                }
            } else if (self.contentManifest.referredLink) { // else discover content if this session is started by a link click
                [self discoverViewContents:rootView contentData:nil contentKeys:contentKeysArray clearText:YES ID:@""];
            }
            if (contentKeysArray && contentKeysArray.count > 0) {
                NSMutableDictionary *contentEventObj = [[NSMutableDictionary alloc] init];
                [contentEventObj setObject:[NSString stringWithFormat:@"%f", [[NSDate date] timeIntervalSince1970]] forKey:BRANCH_TIME_STAMP_KEY];
                if (self.contentManifest.referredLink.length) {
                    [contentEventObj setObject:self.contentManifest.referredLink forKey:BRANCH_REFERRAL_LINK_KEY];
                }
                
                [contentEventObj setObject:[NSString stringWithFormat:@"/%@", _lastViewControllerName] forKey:BRANCH_VIEW_KEY];
                [contentEventObj setObject:!isClearText? @"true" : @"false" forKey:BRANCH_HASH_MODE_KEY];
                [contentEventObj setObject:contentKeysArray forKey:BRANCH_CONTENT_KEYS_KEY];
                if (contentDataArray && contentDataArray.count > 0) {
                    [contentEventObj setObject:contentDataArray forKey:BRANCH_CONTENT_DATA_KEY];
                }
                
                [[BNCPreferenceHelper preferenceHelper] saveBranchAnalyticsData:contentEventObj];
            }
        }
    }
}


- (void)discoverViewContents:(UIView *)rootView
                 contentData:(NSMutableArray *)contentDataArray
                 contentKeys:(NSMutableArray *)contentKeysArray
                   clearText:(BOOL)isClearText
                          ID:(NSString *)viewId {
    if ([rootView isKindOfClass:UITableView.class] || [rootView isKindOfClass:UICollectionView.class]) {
        NSArray *cells = [rootView performSelector:@selector(visibleCells) withObject:nil];
        NSInteger cellCnt = -1;
        for (UIView *cell in cells) {
            cellCnt++;
            NSString *cellViewId = nil;
            if (viewId.length > 0) {
                cellViewId = [viewId stringByAppendingFormat:@"-%ld", (long) cellCnt];
            } else {
                cellViewId = [NSString stringWithFormat:@"%ld", (long) cellCnt];
            }
            [self discoverViewContents:cell
                contentData:contentDataArray
                contentKeys:contentKeysArray
                clearText:isClearText
                ID:cellViewId];
        }
    } else {
        NSString *contentData = [self getContentText:rootView];
        if (contentData) {
            NSString *viewFriendlyName = [NSString stringWithFormat:@"%@:%@", [rootView class], viewId];
            [contentKeysArray addObject:viewFriendlyName];
            if (contentDataArray) {
                [self addFormattedContentData:contentDataArray withText:contentData clearText:isClearText];
            }
        }
        NSArray *subViews = [rootView subviews];
        NSInteger childCount = 0;
        for (UIView *view in subViews) {
            NSString *subViewId = nil;
            if (viewId.length > 0) {
                subViewId = [viewId stringByAppendingFormat:@"-%ld", (long) childCount];
            } else {
                subViewId = [NSString stringWithFormat:@"%ld", (long) childCount];
            }
            childCount++;
            [self discoverViewContents:view
                contentData:contentDataArray
                contentKeys:contentKeysArray
                clearText:isClearText
                ID:subViewId];
        }
    }
}


- (void)discoverFilteredViewContents:(UIViewController *)viewController
                         contentData:(NSMutableArray *)contentDataArray
                         contentKeys:(NSMutableArray *)contentKeysArray
                           clearText:(BOOL)isClearText {
    for (NSString *contentKey in contentKeysArray) {
        NSString *contentData = [self getViewText:contentKey forController:viewController];
        if (contentData == nil) {
            contentData = @"";
        }
        if (contentDataArray) {
            [self addFormattedContentData:contentDataArray withText:contentData clearText:isClearText];
        }
    }
}

- (UIView *)getRootView:(UIViewController *)viewController {
    UIView *rootView = [viewController view];
    if ([viewController isKindOfClass:UITableViewController.class]) {
        rootView = ((UITableViewController *)viewController).tableView;
    } else if ([viewController isKindOfClass:UICollectionViewController.class]) {
        rootView = ((UICollectionViewController *)viewController).collectionView;
    }
    return rootView;
}

- (NSString *)getViewText:(NSString *)viewId
            forController:(UIViewController *)viewController {
    NSString *viewTxt = @"";
    if (viewController) {
        UIView *rootView = [viewController view];
        NSArray *viewIDSplitArray = [viewId componentsSeparatedByString:@":"];
        if (viewIDSplitArray.count > 0) {
            viewId = [[viewId componentsSeparatedByString:@":"] objectAtIndex:1];
        }
        NSArray *viewIds = [viewId componentsSeparatedByString:@"-"];
        BOOL foundView = YES;
        for (NSString *subViewIdStr in viewIds) {
            NSInteger subviewId = [subViewIdStr intValue];
            if ([rootView isKindOfClass:UITableView.class] || [rootView isKindOfClass:UICollectionView.class]) {
                NSArray *cells = [rootView performSelector:@selector(visibleCells) withObject:nil];
                if (cells.count > subviewId) {
                    rootView = [cells objectAtIndex:subviewId];
                } else {
                    foundView = NO;
                    break;
                }
            } else {
                if ([rootView subviews].count > subviewId) {
                    rootView = [[rootView subviews] objectAtIndex:subviewId];
                } else {
                    foundView = NO;
                    break;
                }
            }
        }
        if (foundView) {
            NSString *contentVal = [self getContentText:rootView];
            if (contentVal) {
                viewTxt = contentVal;
            }
        }
    }
    return viewTxt;
}

- (void)addFormattedContentData:(NSMutableArray *)contentDataArray
                       withText:(NSString *)contentData
                      clearText:(BOOL)isClearText {
    if (contentData && contentData.length > self.contentManifest.maxTextLen) {
        contentData = [contentData substringToIndex:self.contentManifest.maxTextLen];
    }
    if (!isClearText) {
        contentData = [BNCEncodingUtils sha256Encode:contentData];
    }
    if (contentData)
        [contentDataArray addObject:contentData];
}

- (NSString *)getContentText:(UIView *)view {
    NSString *contentData = nil;
    if ([view respondsToSelector:@selector(text)]) {
        contentData = [view performSelector:@selector(text) withObject:nil];
    }
    if (contentData == nil || contentData.length == 0) {
        if ([view respondsToSelector:@selector(attributedText)]) {
            contentData = [view performSelector:@selector(attributedText) withObject:nil];
        }
    }
    
    if (contentData == nil || contentData.length == 0) {
        if ([view isKindOfClass:UIButton.class]) {
            contentData = [view performSelector:@selector(titleLabel) withObject:nil];
            if (contentData) {
                contentData = [(UILabel *) contentData text];
            }
        } else if ([view isKindOfClass:UITextField.class]) {
            contentData = [view performSelector:@selector(attributedPlaceholder) withObject:nil];
            if (contentData) {
                contentData = [(NSAttributedString *) contentData string];
            }
        }
    }
    return contentData;
}

@end



