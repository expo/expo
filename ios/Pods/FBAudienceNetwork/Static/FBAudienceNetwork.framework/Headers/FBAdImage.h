// Copyright 2004-present Facebook. All Rights Reserved.
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

#import <FBAudienceNetwork/FBAdDefines.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Represents an image creative.
 */
FB_CLASS_EXPORT
@interface FBAdImage : NSObject

/**
 Typed access to the image url.
 */
@property (nonatomic, copy, readonly) NSURL *url;
/**
 Typed access to the image width.
 */
@property (nonatomic, assign, readonly) NSInteger width;
/**
 Typed access to the image height.
 */
@property (nonatomic, assign, readonly) NSInteger height;

/**
 This is a method to initialize an FBAdImage.

 @param url the image url.
 @param width the image width.
 @param height the image height.
 */
- (instancetype)initWithURL:(NSURL *)url width:(NSInteger)width height:(NSInteger)height NS_DESIGNATED_INITIALIZER;

/**
 Loads an image from self.url over the network, or returns the cached image immediately.

 @param block Block to handle the loaded image.
 */
- (void)loadImageAsyncWithBlock:(nullable void (^)(UIImage *__nullable image))block;

@end

NS_ASSUME_NONNULL_END
