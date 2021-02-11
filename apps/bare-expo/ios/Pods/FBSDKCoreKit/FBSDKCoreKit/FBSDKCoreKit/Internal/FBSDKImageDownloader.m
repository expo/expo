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

#import "FBSDKImageDownloader.h"

static NSString *const kImageDirectory = @"fbsdkimages";
static NSString *const kCachedResponseUserInfoKeyTimestamp = @"timestamp";

@implementation FBSDKImageDownloader
{
  NSURLCache *_urlCache;
}

+ (FBSDKImageDownloader *)sharedInstance
{
  static FBSDKImageDownloader *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[FBSDKImageDownloader alloc] init];
  });
  return instance;
}

- (instancetype)init
{
  if ((self = [super init])) {
  #if TARGET_OS_MACCATALYST
    _urlCache = [[NSURLCache alloc] initWithMemoryCapacity:1024 * 1024 * 8
                                              diskCapacity:1024 * 1024 * 100
                                              directoryURL:[NSURL URLWithString:kImageDirectory]];
  #else
    _urlCache = [[NSURLCache alloc] initWithMemoryCapacity:1024 * 1024 * 8
                                              diskCapacity:1024 * 1024 * 100
                                                  diskPath:kImageDirectory];
  #endif
  }
  return self;
}

- (void)removeAll
{
  [_urlCache removeAllCachedResponses];
}

- (void)downloadImageWithURL:(NSURL *)url
                         ttl:(NSTimeInterval)ttl
                  completion:(FBSDKImageDownloadBlock)completion
{
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  NSCachedURLResponse *cachedResponse = [_urlCache cachedResponseForRequest:request];
  NSDate *modificationDate = cachedResponse.userInfo[kCachedResponseUserInfoKeyTimestamp];
  BOOL isExpired = ([[modificationDate dateByAddingTimeInterval:ttl] compare:[NSDate date]] == NSOrderedAscending);

  void (^completionWrapper)(NSCachedURLResponse *) = ^(NSCachedURLResponse *responseData) {
    if (completion != NULL) {
      UIImage *image = [UIImage imageWithData:responseData.data];
      completion(image);
    }
  };

  if (cachedResponse == nil || isExpired) {
    NSURLSession *session = [NSURLSession sharedSession];
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request
                                            completionHandler:
                                  ^(NSData *data, NSURLResponse *response, NSError *error) {
                                    if ([response isKindOfClass:[NSHTTPURLResponse class]]
                                        && ((NSHTTPURLResponse *)response).statusCode == 200
                                        && error == nil
                                        && data != nil) {
                                      NSCachedURLResponse *responseToCache =
                                      [[NSCachedURLResponse alloc] initWithResponse:response
                                                                               data:data
                                                                           userInfo:@{ kCachedResponseUserInfoKeyTimestamp : [NSDate date] }
                                                                      storagePolicy:NSURLCacheStorageAllowed];
                                      [self->_urlCache storeCachedResponse:responseToCache forRequest:request];
                                      completionWrapper(responseToCache);
                                    } else if (completion != NULL) {
                                      completion(nil);
                                    }
                                  }];
    [task resume];
  } else {
    completionWrapper(cachedResponse);
  }
}

@end
