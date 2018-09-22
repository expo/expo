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

#import <Foundation/Foundation.h>

@class BFTask;

// Check if Bolts.framework is available for import
#if __has_include(<Bolts/BFAppLinkResolving.h>)
// Import it if it's available
# import <Bolts/BFAppLinkResolving.h>
#else
// Otherwise - redeclare BFAppLinkResolving protocol to resolve the problem of missing symbols
// Please note: Bolts.framework is still required for AppLink resolving to work,
// but this allows FBSDKCoreKit to weakly link Bolts.framework as well as this enables clang modulemaps to work.

/**
 Implement this protocol to provide an alternate strategy for resolving
 App Links that may include pre-fetching, caching, or querying for App Link
 data from an index provided by a service provider.
 */
@protocol BFAppLinkResolving <NSObject>

/**
 Asynchronously resolves App Link data for a given URL.

 - Parameter url: The URL to resolve into an App Link.
 - Returns: A BFTask that will return a BFAppLink for the given URL.
 */
- (BFTask *)appLinkFromURLInBackground:(NSURL *)url;

@end

#endif

/**

  Provides an implementation of the BFAppLinkResolving protocol that uses the Facebook App Link
 Index API to resolve App Links given a URL. It also provides an additional helper method that can resolve
 multiple App Links in a single call.



 Usage of this type requires a client token. See `[FBSDKSettings setClientToken:]` and linking
 Bolts.framework
 */
@interface FBSDKAppLinkResolver : NSObject<BFAppLinkResolving>

/**
  Asynchronously resolves App Link data for multiple URLs.

 - Parameter urls: An array of NSURLs to resolve into App Links.
 - Returns: A BFTask that will return dictionary mapping input NSURLs to their
  corresponding BFAppLink.



 You should set the client token before making this call. See `[FBSDKSettings setClientToken:]`
 */
- (BFTask *)appLinksFromURLsInBackground:(NSArray *)urls;

/**
  Allocates and initializes a new instance of FBSDKAppLinkResolver.
 */
+ (instancetype)resolver;

@end
