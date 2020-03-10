//
//  EXWebBrowserDelegate.h
//  EXWebBrowser
//
//  Created by Michał Czernek on 10/03/2020.
//

#import <Foundation/Foundation.h>
#import <UMCore/UMUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXWebBrowserDelegate : NSObject

- (void) openAuthSessionAsyncWithUrl:(NSString*)url
                 withRedirectURL:(NSString*)redirectUrl
                    withResolver:(UMPromiseResolveBlock)resolver
                    withRejecter:(UMPromiseRejectBlock)rejecter;

- (void) openBrowserAsyncWithUrl:(NSString*)url
                   withArguments:(NSDictionary*)arguments
                    withResolver:(UMPromiseResolveBlock)resolver
                    withRejecter:(UMPromiseRejectBlock)rejecter;

- (void) dismissBrowser:(UMPromiseResolveBlock)resolver
           withRejecter:(UMPromiseRejectBlock)rejecter;

- (void) dismissAuthSession:(UMPromiseResolveBlock)resolver
               withRejecter:(UMPromiseRejectBlock)rejecter;

@end

NS_ASSUME_NONNULL_END
