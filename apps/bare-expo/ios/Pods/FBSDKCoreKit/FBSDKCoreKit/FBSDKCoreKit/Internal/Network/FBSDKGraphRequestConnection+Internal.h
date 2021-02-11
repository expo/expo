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

@class FBSDKGraphRequestBody;
@class FBSDKURLSession;

#if SWIFT_PACKAGE
 #import "FBSDKGraphRequestConnection.h"
#else
 #import <FBSDKCoreKit/FBSDKGraphRequestConnection.h>
#endif

@interface FBSDKGraphRequestConnection (Internal)

@property (nonatomic, readonly) NSMutableArray *requests;
@property (nonatomic, strong) FBSDKURLSession *session;

/**
 Get the graph request url for a single graph request
 @param request The Graph Request we need the url for
 @param forBatch whether the request is a batch request.
 */
- (NSString *)urlStringForSingleRequest:(FBSDKGraphRequest *)request forBatch:(BOOL)forBatch;

/**
 Add the specified body as the HTTPBody of the specified request.
 @param body The FBSDKGraphRequestBody to attach to the request.
 @param request The NSURLRequest to attach the body to.
 */
- (void)addBody:(FBSDKGraphRequestBody *)body toPostRequest:(NSMutableURLRequest *)request;

@end
