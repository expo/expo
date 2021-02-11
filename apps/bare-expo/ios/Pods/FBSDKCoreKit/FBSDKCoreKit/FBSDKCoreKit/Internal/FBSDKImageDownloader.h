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

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Describes the callback for downloadImageWithURL:ttl:completion:.
 @param image the optional image returned
 */
typedef void (^FBSDKImageDownloadBlock)(UIImage *_Nullable image)
NS_SWIFT_NAME(ImageDownloadBlock);

/*
  simple class to manage image downloads

 this class is not smart enough to dedupe identical requests in flight.
 */
NS_SWIFT_NAME(ImageDownloader)
@interface FBSDKImageDownloader : NSObject

@property (class, nonatomic, strong, readonly) FBSDKImageDownloader *sharedInstance;

/*
  download an image or retrieve it from cache
 @param url the url to download
 @param ttl the amount of time (in seconds) that using a cached version is acceptable.
 @param completion the callback with the image - for simplicity nil is returned rather than surfacing an error.
 */
- (void)downloadImageWithURL:(NSURL *)url
                         ttl:(NSTimeInterval)ttl
                  completion:(nullable FBSDKImageDownloadBlock)completion;

- (void)removeAll;

@end

NS_ASSUME_NONNULL_END
