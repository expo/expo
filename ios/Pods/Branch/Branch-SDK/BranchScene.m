//
//  BranchScene.m
//  Branch
//
//  Created by Ernest Cho on 3/24/20.
//  Copyright © 2020 Branch, Inc. All rights reserved.
//

#import "BranchScene.h"
#import "Branch.h"
#import "BNCLog.h"

@implementation BranchScene

+ (BranchScene *)shared NS_EXTENSION_UNAVAILABLE("BranchScene does not support Extensions") {
    static BranchScene *bscene;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        bscene = [BranchScene new];
    });
    return bscene;
}

- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options registerDeepLinkHandler:(void (^ _Nonnull)(NSDictionary * _Nullable params, NSError * _Nullable error, UIScene * _Nullable scene))callback NS_EXTENSION_UNAVAILABLE("BranchScene does not support Extensions") {
    [[Branch getInstance] initSceneSessionWithLaunchOptions:options isReferrable:YES explicitlyRequestedReferrable:NO automaticallyDisplayController:NO registerDeepLinkHandler:^(BNCInitSessionResponse * _Nullable initResponse, NSError * _Nullable error) {
        if (callback) {
            if (initResponse) {
                callback(initResponse.params, error, [self sceneForIdentifier:initResponse.sceneIdentifier]);
            } else {
                callback([NSDictionary new], error, [self sceneForIdentifier:initResponse.sceneIdentifier]);
            }
        }
    }];
}

- (void)scene:(UIScene *)scene continueUserActivity:(NSUserActivity *)userActivity NS_EXTENSION_UNAVAILABLE("BranchScene does not support Extensions") {
    NSString *identifier = scene.session.persistentIdentifier;
    [[Branch getInstance] continueUserActivity:userActivity sceneIdentifier:identifier];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts NS_EXTENSION_UNAVAILABLE("BranchScene does not support Extensions") {
    if (URLContexts.count != 1) {
        BNCLogWarning(@"Branch only supports a single URLContext");
    }
    
    UIOpenURLContext *context = [URLContexts allObjects].firstObject;
    if (context) {
        NSString *identifier = scene.session.persistentIdentifier;
        [[Branch getInstance] sceneIdentifier:identifier openURL:context.URL sourceApplication:context.options.sourceApplication annotation:context.options.annotation];
    }
}

- (nullable UIScene *)sceneForIdentifier:(NSString *)identifier NS_EXTENSION_UNAVAILABLE("BranchScene does not support Extensions") {
    UIScene *scene = nil;
    if (identifier) {
        NSArray<UIScene *> *scenes = [[[UIApplication sharedApplication] connectedScenes] allObjects];
        for (UIScene *scene in scenes) {
            if ([identifier isEqualToString:scene.session.persistentIdentifier]) {
                return scene;
            }
        }
    }
    return scene;
}

@end
