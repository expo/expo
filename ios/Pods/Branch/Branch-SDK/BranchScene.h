//
//  BranchScene.h
//  Branch
//
//  Created by Ernest Cho on 3/24/20.
//  Copyright © 2020 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Provide  support for UIScene.  This is only supported on iOS 13.0+, iPadOS 13.0+
*/
API_AVAILABLE(ios(13.0))
@interface BranchScene : NSObject

+ (BranchScene *)shared;

- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options
             registerDeepLinkHandler:(void (^ _Nonnull)(NSDictionary * _Nullable params, NSError * _Nullable error, UIScene * _Nullable scene))callback;

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity;

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts;

@end

NS_ASSUME_NONNULL_END
