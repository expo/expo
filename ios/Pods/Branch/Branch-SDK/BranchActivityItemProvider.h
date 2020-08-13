//
//  BranchActivityItemProvider.h
//  Branch-TestBed
//
//  Created by Scott Hasbrouck on 1/28/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
@import UIKit;
#else
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#endif

/**
 The `BranchActivityItemProviderDelegate` allows you  to customize the link parameters based on the channel chosen by the user.
 This is useful in the case that you want to add specific items only for Facebook or Twitter for instance.

 Every item is optional, and if not provided, will fallback to the item provided with the constructor.
 */
@protocol BranchActivityItemProviderDelegate <NSObject>

@optional
- (NSDictionary *)activityItemParamsForChannel:(NSString *)channel;
- (NSArray *)activityItemTagsForChannel:(NSString *)channel;
- (NSString *)activityItemFeatureForChannel:(NSString *)channel;
- (NSString *)activityItemStageForChannel:(NSString *)channel;
- (NSString *)activityItemCampaignForChannel:(NSString *)channel;
- (NSString *)activityItemAliasForChannel:(NSString *)channel;
- (NSString *)activityItemOverrideChannelForChannel:(NSString *)channel;

@end

@interface BranchActivityItemProvider : UIActivityItemProvider

- (id)initWithParams:(NSDictionary *)params andTags:(NSArray *)tags andFeature:(NSString *)feature andStage:(NSString *)stage andAlias:(NSString *)alias  __attribute__((deprecated(("Use the delegate method instead"))));;
- (id)initWithParams:(NSDictionary *)params tags:(NSArray *)tags feature:(NSString *)feature stage:(NSString *)stage campaign:(NSString *)campaign alias:(NSString *)alias delegate:(id <BranchActivityItemProviderDelegate>)delegate;

+ (NSString *)humanReadableChannelWithActivityType:(NSString *)activityString;
@end
