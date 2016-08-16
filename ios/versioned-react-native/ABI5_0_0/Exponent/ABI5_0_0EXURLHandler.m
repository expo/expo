#import "ABI5_0_0EXURLHandler.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTEventDispatcher.h"

@import UIKit;

@implementation ABI5_0_0EXURLHandler

ABI5_0_0RCT_EXPORT_MODULE()

static NSString * const ABI5_0_0EXURLHandlerOpenURLNotification = @"ABI5_0_0EXURLHandlerOpenURL";

@synthesize bridge = _bridge;

- (instancetype)init
{
    if (self = [super init]) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(_dispatchOpenURLEvent:)
                                                     name:ABI5_0_0EXURLHandlerOpenURLNotification
                                                   object:nil];
    }
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

/**
 * Opens the given URL, which must be an internal URL.
 *
 * Do not call this from application code to navigate to a given URL. Call -[UIApplication openURL:] instead. This
 * method is to be called from the UIApplicationDelegate when it needs to open a URL.
 */
+ (BOOL)openInternalURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:@{
      @"url": url.absoluteString,
    }];
    if (sourceApplication) {
        userInfo[@"sourceApplication"] = sourceApplication;
    }
    if (annotation) {
        userInfo[@"annotation"] = annotation;
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI5_0_0EXURLHandlerOpenURLNotification object:self userInfo:userInfo];
    return YES;
}

- (void)_dispatchOpenURLEvent:(NSNotification *)notification
{
    [self.bridge.eventDispatcher sendDeviceEventWithName:@"ABI5_0_0EXURLHandler.openURL" body:notification.userInfo];
}

#pragma mark - JavaScript

- (NSDictionary *)constantsToExport
{
    NSDictionary *launchOptions = self.bridge.launchOptions;
    NSMutableDictionary *constants = [NSMutableDictionary dictionaryWithDictionary:@{
        @"schemes": [self _supportedURLSchemes],
        @"initialURL": [launchOptions[UIApplicationLaunchOptionsURLKey] absoluteString] ?: [NSNull null],
        @"settingsURL": UIApplicationOpenSettingsURLString ?: [NSNull null],
    }];

    if (launchOptions[UIApplicationLaunchOptionsSourceApplicationKey]) {
        NSMutableDictionary *referrer = [NSMutableDictionary dictionaryWithDictionary:@{
            @"sourceApplication": launchOptions[UIApplicationLaunchOptionsSourceApplicationKey],
        }];
        if (launchOptions[UIApplicationLaunchOptionsAnnotationKey]) {
            referrer[@"annotation"] = launchOptions[UIApplicationLaunchOptionsAnnotationKey];
        }
        constants[@"initialReferrer"] = referrer;
    }
    return constants;
}

- (NSArray *)_supportedURLSchemes
{
    NSMutableSet *schemes = [NSMutableSet set];
    NSDictionary *info = [NSBundle mainBundle].infoDictionary;
    for (NSDictionary *urlType in info[@"CFBundleURLTypes"]) {
        for (NSString *scheme in urlType[@"CFBundleURLSchemes"]) {
            [schemes addObject:scheme.lowercaseString];
        }
    }
    return schemes.allObjects;
}

ABI5_0_0RCT_REMAP_METHOD(openURLAsync,
                 openURL:(NSURL *)url
                resolver:(ABI5_0_0RCTPromiseResolveBlock)resolve
                rejecter:(ABI5_0_0RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        BOOL opened = [[UIApplication sharedApplication] openURL:url];
        resolve(@(opened));
    });
}

ABI5_0_0RCT_REMAP_METHOD(canOpenURLAsync,
                 canOpenURL:(NSURL *)url
                   resolver:(ABI5_0_0RCTPromiseResolveBlock)resolve
                   rejecter:(ABI5_0_0RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        BOOL canOpen = [[UIApplication sharedApplication] canOpenURL:url];
        resolve(@(canOpen));
    });
}

@end
