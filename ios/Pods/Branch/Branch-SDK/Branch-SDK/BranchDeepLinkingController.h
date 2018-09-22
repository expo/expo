//
//  BranchDeepLinkingController.h
//  Branch-TestBed
//
//  Created by Graham Mueller on 6/18/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
@import UIKit;
#else
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#endif

@protocol BranchDeepLinkingControllerCompletionDelegate <NSObject>

- (void)deepLinkingControllerCompleted
    __attribute__((deprecated(("This API is deprecated. Instead, use deepLinkingControllerCompletedFrom: viewController"))));;

- (void)deepLinkingControllerCompletedFrom:(UIViewController*) viewController;

@end

typedef NS_ENUM(NSInteger, BNCViewControllerPresentationOption) {
    BNCViewControllerOptionShow,
    BNCViewControllerOptionPush,
    BNCViewControllerOptionPresent
};

#pragma mark - BranchDeepLinkingController Protocol

@protocol BranchDeepLinkingController <NSObject>

- (void)configureControlWithData:(NSDictionary *)data;
@property (weak, nonatomic) id <BranchDeepLinkingControllerCompletionDelegate> deepLinkingCompletionDelegate;

@end
