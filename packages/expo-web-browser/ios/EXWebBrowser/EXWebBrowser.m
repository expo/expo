// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXWebBrowser/EXWebBrowser.h>
#import <EXWebBrowser/EXWebBrowserDelegate.h>

#import <UMCore/UMUtilities.h>

@implementation EXWebBrowser

EXWebBrowserDelegate *delegate;

UM_EXPORT_MODULE(ExpoWebBrowser)

UM_EXPORT_METHOD_AS(openAuthSessionAsync,
                    openAuthSessionAsync:(NSString *)authURL
                    redirectURL:(NSString *)redirectURL
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [delegate openAuthSessionAsyncWithUrl:authURL withRedirectURL:redirectURL withResolver:resolve withRejecter:reject];
}


UM_EXPORT_METHOD_AS(openBrowserAsync,
                    openBrowserAsync:(NSString *)authURL
                    withArguments:(NSDictionary *)arguments
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [delegate openBrowserAsyncWithUrl:authURL withArguments:arguments withResolver:resolve withRejecter:reject];
}

UM_EXPORT_METHOD_AS(dismissBrowser,
                    dismissBrowserWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [delegate dismissBrowser:resolve withRejecter:reject];
}

UM_EXPORT_METHOD_AS(dismissAuthSession,
                    dismissAuthSessionWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [delegate dismissAuthSession:resolve withRejecter:reject];
}

UM_EXPORT_METHOD_AS(warmUpAsync,
                    warmUpAsyncWithPackage:(NSString*)browserPackage
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(coolDownAsync,
                    coolDownAsyncWithPackage:(NSString*)browserPackage
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(getCustomTabsSupportingBrowsers,
                    getCustomTabsSupportingBrowsersWithPackage:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

UM_EXPORT_METHOD_AS(mayInitWithUrlAsync,
                     warmUpAsyncWithUrl:(NSString*)url
                     browserPackage:(NSString*)package
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  // stub for jest-expo-mock-generator
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  delegate = [EXWebBrowserDelegate new];
}

@end
