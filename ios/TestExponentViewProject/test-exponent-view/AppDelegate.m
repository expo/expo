// Copyright 2015-present 650 Industries. All rights reserved.

#import "AppDelegate.h"
#import "ExponentViewManager.h"
#import "EXViewController.h"

@interface AppDelegate ()

@property (nonatomic, strong) EXViewController *rootViewController;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    _window.backgroundColor = [UIColor whiteColor];
    [[ExponentViewManager sharedInstance] setLaunchOptions:launchOptions];
    _rootViewController = [ExponentViewManager sharedInstance].rootViewController;
    _window.rootViewController = _rootViewController;
    
    [_rootViewController loadReactApplication];
    [_window makeKeyAndVisible];
    
    return YES;
}


@end
