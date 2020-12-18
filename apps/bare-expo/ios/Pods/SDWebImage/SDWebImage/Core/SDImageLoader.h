/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCompat.h"
#import "SDWebImageDefine.h"
#import "SDWebImageOperation.h"

typedef void(^SDImageLoaderProgressBlock)(NSInteger receivedSize, NSInteger expectedSize, NSURL * _Nullable targetURL);
typedef void(^SDImageLoaderCompletedBlock)(UIImage * _Nullable image, NSData * _Nullable data, NSError * _Nullable error, BOOL finished);

#pragma mark - Context Options

/**
 A `UIImage` instance from `SDWebImageManager` when you specify `SDWebImageRefreshCached` and image cache hit.
 This can be a hint for image loader to load the image from network and refresh the image from remote location if needed. If the image from remote location does not change, you should call the completion with `SDWebImageErrorCacheNotModified` error. (UIImage)
 @note If you don't implement `SDWebImageRefreshCached` support, you do not need to care about this context option.
 */
FOUNDATION_EXPORT SDWebImageContextOption _Nonnull const SDWebImageContextLoaderCachedImage;

#pragma mark - Helper method

/**
 This is the built-in decoding process for image download from network or local file.
 @note If you want to implement your custom loader with `requestImageWithURL:options:context:progress:completed:` API, but also want to keep compatible with SDWebImage's behavior, you'd better use this to produce image.

 @param imageData The image data from the network. Should not be nil
 @param imageURL The image URL from the input. Should not be nil
 @param options The options arg from the input
 @param context The context arg from the input
 @return The decoded image for current image data load from the network
 */
FOUNDATION_EXPORT UIImage * _Nullable SDImageLoaderDecodeImageData(NSData * _Nonnull imageData, NSURL * _Nonnull imageURL, SDWebImageOptions options, SDWebImageContext * _Nullable context);

/**
 This is the built-in decoding process for image progressive download from network. It's used when `SDWebImageProgressiveLoad` option is set. (It's not required when your loader does not support progressive image loading)
 @note If you want to implement your custom loader with `requestImageWithURL:options:context:progress:completed:` API, but also want to keep compatible with SDWebImage's behavior, you'd better use this to produce image.

 @param imageData The image data from the network so far. Should not be nil
 @param imageURL The image URL from the input. Should not be nil
 @param finished Pass NO to specify the download process has not finished. Pass YES when all image data has finished.
 @param operation The loader operation associated with current progressive download. Why to provide this is because progressive decoding need to store the partial decoded context for each operation to avoid conflict. You should provide the operation from `loadImageWithURL:` method return value.
 @param options The options arg from the input
 @param context The context arg from the input
 @return The decoded progressive image for current image data load from the network
 */
FOUNDATION_EXPORT UIImage * _Nullable SDImageLoaderDecodeProgressiveImageData(NSData * _Nonnull imageData, NSURL * _Nonnull imageURL, BOOL finished,  id<SDWebImageOperation> _Nonnull operation, SDWebImageOptions options, SDWebImageContext * _Nullable context);

#pragma mark - SDImageLoader

/**
 This is the protocol to specify custom image load process. You can create your own class to conform this protocol and use as a image loader to load image from network or any available remote resources defined by yourself.
 If you want to implement custom loader for image download from network or local file, you just need to concentrate on image data download only. After the download finish, call `SDImageLoaderDecodeImageData` or `SDImageLoaderDecodeProgressiveImageData` to use the built-in decoding process and produce image (Remember to call in the global queue). And finally callback the completion block.
 If you directly get the image instance using some third-party SDKs, such as image directly from Photos framework. You can process the image data and image instance by yourself without that built-in decoding process. And finally callback the completion block.
 @note It's your responsibility to load the image in the desired global queue(to avoid block main queue). We do not dispatch these method call in a global queue but just from the call queue (For `SDWebImageManager`, it typically call from the main queue).
*/
@protocol SDImageLoader <NSObject>

@required
/**
 Whether current image loader supports to load the provide image URL.
 This will be checked every time a new image request come for loader. If this return NO, we will mark this image load as failed. If return YES, we will start to call `requestImageWithURL:options:context:progress:completed:`.

 @param url The image URL to be loaded.
 @return YES to continue download, NO to stop download.
 */
- (BOOL)canRequestImageForURL:(nullable NSURL *)url API_DEPRECATED("Use canRequestImageForURL:options:context: instead", macos(10.10, API_TO_BE_DEPRECATED), ios(8.0, API_TO_BE_DEPRECATED), tvos(9.0, API_TO_BE_DEPRECATED), watchos(2.0, API_TO_BE_DEPRECATED));

@optional
/**
 Whether current image loader supports to load the provide image URL, with associated options and context.
 This will be checked every time a new image request come for loader. If this return NO, we will mark this image load as failed. If return YES, we will start to call `requestImageWithURL:options:context:progress:completed:`.

 @param url The image URL to be loaded.
 @param options A mask to specify options to use for this request
 @param context A context contains different options to perform specify changes or processes, see `SDWebImageContextOption`. This hold the extra objects which `options` enum can not hold.
 @return YES to continue download, NO to stop download.
 */
- (BOOL)canRequestImageForURL:(nullable NSURL *)url
                      options:(SDWebImageOptions)options
                      context:(nullable SDWebImageContext *)context;

@required
/**
 Load the image and image data with the given URL and return the image data. You're responsible for producing the image instance.

 @param url The URL represent the image. Note this may not be a HTTP URL
 @param options A mask to specify options to use for this request
 @param context A context contains different options to perform specify changes or processes, see `SDWebImageContextOption`. This hold the extra objects which `options` enum can not hold.
 @param progressBlock A block called while image is downloading
 *                    @note the progress block is executed on a background queue
 @param completedBlock A block called when operation has been completed.
 @return An operation which allow the user to cancel the current request.
 */
- (nullable id<SDWebImageOperation>)requestImageWithURL:(nullable NSURL *)url
                                                options:(SDWebImageOptions)options
                                                context:(nullable SDWebImageContext *)context
                                               progress:(nullable SDImageLoaderProgressBlock)progressBlock
                                              completed:(nullable SDImageLoaderCompletedBlock)completedBlock;


/**
 Whether the error from image loader should be marked indeed un-recoverable or not.
 If this return YES, failed URL which does not using `SDWebImageRetryFailed` will be blocked into black list. Else not.

 @param url The URL represent the image. Note this may not be a HTTP URL
 @param error The URL's loading error, from previous `requestImageWithURL:options:context:progress:completed:` completedBlock's error.
 @return Whether to block this url or not. Return YES to mark this URL as failed.
 */
- (BOOL)shouldBlockFailedURLWithURL:(nonnull NSURL *)url
                              error:(nonnull NSError *)error API_DEPRECATED("Use shouldBlockFailedURLWithURL:error:options:context: instead", macos(10.10, API_TO_BE_DEPRECATED), ios(8.0, API_TO_BE_DEPRECATED), tvos(9.0, API_TO_BE_DEPRECATED), watchos(2.0, API_TO_BE_DEPRECATED));

@optional
/**
 Whether the error from image loader should be marked indeed un-recoverable or not, with associated options and context.
 If this return YES, failed URL which does not using `SDWebImageRetryFailed` will be blocked into black list. Else not.

 @param url The URL represent the image. Note this may not be a HTTP URL
 @param error The URL's loading error, from previous `requestImageWithURL:options:context:progress:completed:` completedBlock's error.
 @param options A mask to specify options to use for this request
 @param context A context contains different options to perform specify changes or processes, see `SDWebImageContextOption`. This hold the extra objects which `options` enum can not hold.
 @return Whether to block this url or not. Return YES to mark this URL as failed.
 */
- (BOOL)shouldBlockFailedURLWithURL:(nonnull NSURL *)url
                              error:(nonnull NSError *)error
                            options:(SDWebImageOptions)options
                            context:(nullable SDWebImageContext *)context;

@end
