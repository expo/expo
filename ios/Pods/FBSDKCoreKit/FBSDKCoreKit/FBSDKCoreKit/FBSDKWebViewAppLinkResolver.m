// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKWebViewAppLinkResolver.h"

#import <UIKit/UIKit.h>

#import "FBSDKAppLink.h"
#import "FBSDKAppLinkTarget.h"

/**
 Describes the callback for appLinkFromURLInBackground.
 @param result the results from following redirects
 @param error the error during the request, if any

 */
typedef void (^FBSDKURLFollowRedirectsHandler)(NSDictionary<NSString *, id> *result, NSError * _Nullable error);

// Defines JavaScript to extract app link tags from HTML content
static NSString *const FBSDKWebViewAppLinkResolverTagExtractionJavaScript = @""
"(function() {"
"  var metaTags = document.getElementsByTagName('meta');"
"  var results = [];"
"  for (var i = 0; i < metaTags.length; i++) {"
"    var property = metaTags[i].getAttribute('property');"
"    if (property && property.substring(0, 'al:'.length) === 'al:') {"
"      var tag = { \"property\": metaTags[i].getAttribute('property') };"
"      if (metaTags[i].hasAttribute('content')) {"
"        tag['content'] = metaTags[i].getAttribute('content');"
"      }"
"      results.push(tag);"
"    }"
"  }"
"  return JSON.stringify(results);"
"})()";
static NSString *const FBSDKWebViewAppLinkResolverIOSURLKey = @"url";
static NSString *const FBSDKWebViewAppLinkResolverIOSAppStoreIdKey = @"app_store_id";
static NSString *const FBSDKWebViewAppLinkResolverIOSAppNameKey = @"app_name";
static NSString *const FBSDKWebViewAppLinkResolverDictionaryValueKey = @"_value";
static NSString *const FBSDKWebViewAppLinkResolverPreferHeader = @"Prefer-Html-Meta-Tags";
static NSString *const FBSDKWebViewAppLinkResolverMetaTagPrefix = @"al";
static NSString *const FBSDKWebViewAppLinkResolverWebKey = @"web";
static NSString *const FBSDKWebViewAppLinkResolverIOSKey = @"ios";
static NSString *const FBSDKWebViewAppLinkResolverIPhoneKey = @"iphone";
static NSString *const FBSDKWebViewAppLinkResolverIPadKey = @"ipad";
static NSString *const FBSDKWebViewAppLinkResolverWebURLKey = @"url";
static NSString *const FBSDKWebViewAppLinkResolverShouldFallbackKey = @"should_fallback";

@interface FBSDKWebViewAppLinkResolverWebViewDelegate : NSObject <UIWebViewDelegate>

@property (nonatomic, copy) void (^didFinishLoad)(UIWebView *webView);
@property (nonatomic, copy) void (^didFailLoadWithError)(UIWebView *webView, NSError *error);
@property (nonatomic, assign) BOOL hasLoaded;

@end

@implementation FBSDKWebViewAppLinkResolverWebViewDelegate

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    if (self.didFinishLoad) {
        self.didFinishLoad(webView);
    }
}

- (void)webViewDidStartLoad:(UIWebView *)webView {
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
    if (self.didFailLoadWithError) {
        self.didFailLoadWithError(webView, error);
    }
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
    if (self.hasLoaded) {
        // Consider loading a second resource to be "success", since it indicates an inner frame
        // or redirect is happening. We can run the tag extraction script at this point.
        self.didFinishLoad(webView);
        return NO;
    }
    self.hasLoaded = YES;
    return YES;
}

@end

@implementation FBSDKWebViewAppLinkResolver

+ (instancetype)sharedInstance {
    static id instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

- (void)followRedirects:(NSURL *)url handler:(FBSDKURLFollowRedirectsHandler)handler
{
  // This task will be resolved with either the redirect NSURL
  // or a dictionary with the response data to be returned.
  void (^completion)(NSURLResponse *response, NSData *data, NSError *error) = ^(NSURLResponse *response, NSData *data, NSError *error) {
    if (error) {
      handler(nil, error);
      return;
    }

    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;

      // NSURLConnection usually follows redirects automatically, but the
      // documentation is unclear what the default is. This helps it along.
      if (httpResponse.statusCode >= 300 && httpResponse.statusCode < 400) {
        NSString *redirectString = httpResponse.allHeaderFields[@"Location"];
        NSURL *redirectURL = [NSURL URLWithString:redirectString];
        [self followRedirects:redirectURL handler:handler];
        return;
      }
    }

    handler(@{ @"response" : response, @"data" : data }, nil);
  };

  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  [request setValue:FBSDKWebViewAppLinkResolverMetaTagPrefix forHTTPHeaderField:FBSDKWebViewAppLinkResolverPreferHeader];

  NSURLSession *session = [NSURLSession sharedSession];
  [[session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    completion(response, data, error);
  }] resume];
}

- (void)appLinkFromURL:(NSURL *)url handler:(FBSDKAppLinkFromURLHandler)handler
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self followRedirects:url handler:^(NSDictionary<NSString *,id> *result, NSError * _Nullable error) {

      if (error) {
        handler(nil, error);
        return;
      }

      NSData *responseData = result[@"data"];
      NSHTTPURLResponse *response = result[@"response"];

      UIWebView *webView = [[UIWebView alloc] init];
      FBSDKWebViewAppLinkResolverWebViewDelegate *listener = [[FBSDKWebViewAppLinkResolverWebViewDelegate alloc] init];
      __block FBSDKWebViewAppLinkResolverWebViewDelegate *retainedListener = listener;
      listener.didFinishLoad = ^(UIWebView *view) {
        if (retainedListener) {
          NSDictionary<NSString *, id> *ogData = [self getALDataFromLoadedPage:view];
          [view removeFromSuperview];
          view.delegate = nil;
          retainedListener = nil;
          handler([self appLinkFromALData:ogData destination:url], nil);
        }
      };
      listener.didFailLoadWithError = ^(UIWebView* view, NSError *loadError) {
        if (retainedListener) {
          [view removeFromSuperview];
          view.delegate = nil;
          retainedListener = nil;
          handler(nil, loadError);
        }
      };
      webView.delegate = listener;
      webView.hidden = YES;
      [webView loadData:responseData
               MIMEType:response.MIMEType
       textEncodingName:response.textEncodingName
                baseURL:response.URL];
      UIWindow *window = [UIApplication sharedApplication].windows.firstObject;
      [window addSubview:webView];
    }];
  });
}

/*
 Builds up a data structure filled with the app link data from the meta tags on a page.
 The structure of this object is a dictionary where each key holds an array of app link
 data dictionaries.  Values are stored in a key called "_value".
 */
- (NSDictionary<NSString *, id> *)parseALData:(NSArray<NSDictionary<NSString *, id> *> *)dataArray {
    NSMutableDictionary<NSString *, id> *al = [NSMutableDictionary dictionary];
    for (NSDictionary<NSString *, id> *tag in dataArray) {
        NSString *name = tag[@"property"];
        if (![name isKindOfClass:[NSString class]]) {
            continue;
        }
        NSArray<NSString *> *nameComponents = [name componentsSeparatedByString:@":"];
        if (![nameComponents[0] isEqualToString:FBSDKWebViewAppLinkResolverMetaTagPrefix]) {
            continue;
        }
        NSMutableDictionary<NSString *, id> *root = al;
        for (NSUInteger i = 1; i < nameComponents.count; i++) {
            NSMutableArray<NSMutableDictionary<NSString *, id> *> *children = root[nameComponents[i]];
            if (!children) {
                children = [NSMutableArray array];
                root[nameComponents[i]] = children;
            }
            NSMutableDictionary<NSString *, id> *child = children.lastObject;
            if (!child || i == nameComponents.count - 1) {
                child = [NSMutableDictionary dictionary];
                [children addObject:child];
            }
            root = child;
        }
        if (tag[@"content"]) {
            root[FBSDKWebViewAppLinkResolverDictionaryValueKey] = tag[@"content"];
        }
    }
    return al;
}

- (NSDictionary<NSString *, id> *)getALDataFromLoadedPage:(UIWebView *)webView {
    // Run some JavaScript in the webview to fetch the meta tags.
    NSString *jsonString = [webView stringByEvaluatingJavaScriptFromString:FBSDKWebViewAppLinkResolverTagExtractionJavaScript];
    NSError *error = nil;
    NSArray<NSDictionary<NSString *, id> *> *arr =
      [NSJSONSerialization JSONObjectWithData:[jsonString dataUsingEncoding:NSUTF8StringEncoding]
                                      options:0
                                        error:&error];
    return [self parseALData:arr];
}

/*
 Converts app link data into a FBSDKAppLink containing the targets relevant for this platform.
 */
- (FBSDKAppLink *)appLinkFromALData:(NSDictionary<NSString *, id> *)appLinkDict destination:(NSURL *)destination {
    NSMutableArray<FBSDKAppLinkTarget *> *linkTargets = [NSMutableArray array];

    NSArray *platformData = nil;

    const UIUserInterfaceIdiom idiom = UI_USER_INTERFACE_IDIOM();
    if (idiom == UIUserInterfaceIdiomPad) {
        platformData = @[ appLinkDict[FBSDKWebViewAppLinkResolverIPadKey] ?: @{},
                          appLinkDict[FBSDKWebViewAppLinkResolverIOSKey] ?: @{} ];
    } else if (idiom == UIUserInterfaceIdiomPhone) {
        platformData = @[ appLinkDict[FBSDKWebViewAppLinkResolverIPhoneKey] ?: @{},
                          appLinkDict[FBSDKWebViewAppLinkResolverIOSKey] ?: @{} ];
    } else {
        // Future-proofing. Other User Interface idioms should only hit ios.
        platformData = @[ appLinkDict[FBSDKWebViewAppLinkResolverIOSKey] ?: @{} ];
    }

    for (NSArray<NSDictionary *> *platformObjects in platformData) {
        for (NSDictionary<NSString *, NSArray *> *platformDict in platformObjects) {
            // The schema requires a single url/app store id/app name,
            // but we could find multiple of them. We'll make a best effort
            // to interpret this data.
            NSArray<NSDictionary<NSString *, id> *> *urls = platformDict[FBSDKWebViewAppLinkResolverIOSURLKey];
            NSArray<NSDictionary<NSString *, id> *> *appStoreIds = platformDict[FBSDKWebViewAppLinkResolverIOSAppStoreIdKey];
            NSArray<NSDictionary<NSString *, id> *> *appNames = platformDict[FBSDKWebViewAppLinkResolverIOSAppNameKey];

            NSUInteger maxCount = MAX(urls.count, MAX(appStoreIds.count, appNames.count));

            for (NSUInteger i = 0; i < maxCount; i++) {
                NSString *urlString = urls[i][FBSDKWebViewAppLinkResolverDictionaryValueKey];
                NSURL *url = urlString ? [NSURL URLWithString:urlString] : nil;
                NSString *appStoreId = appStoreIds[i][FBSDKWebViewAppLinkResolverDictionaryValueKey];
                NSString *appName = appNames[i][FBSDKWebViewAppLinkResolverDictionaryValueKey];
                FBSDKAppLinkTarget *target = [FBSDKAppLinkTarget appLinkTargetWithURL:url
                                                                           appStoreId:appStoreId
                                                                              appName:appName];
                [linkTargets addObject:target];
            }
        }
    }

    NSDictionary<NSString *, id> *webDict = appLinkDict[FBSDKWebViewAppLinkResolverWebKey][0];
    NSString *webUrlString = webDict[FBSDKWebViewAppLinkResolverWebURLKey][0][FBSDKWebViewAppLinkResolverDictionaryValueKey];
    NSString *shouldFallbackString = webDict[FBSDKWebViewAppLinkResolverShouldFallbackKey][0][FBSDKWebViewAppLinkResolverDictionaryValueKey];

    NSURL *webUrl = destination;

    if (shouldFallbackString &&
        [@[ @"no", @"false", @"0" ] containsObject:[shouldFallbackString lowercaseString]]) {
        webUrl = nil;
    }
    if (webUrl && webUrlString) {
        webUrl = [NSURL URLWithString:webUrlString];
    }

    return [FBSDKAppLink appLinkWithSourceURL:destination
                                      targets:linkTargets
                                       webURL:webUrl];
}

@end
