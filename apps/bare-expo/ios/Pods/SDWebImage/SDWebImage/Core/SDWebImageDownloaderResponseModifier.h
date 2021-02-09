/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

typedef NSURLResponse * _Nullable (^SDWebImageDownloaderResponseModifierBlock)(NSURLResponse * _Nonnull response);

/**
 This is the protocol for downloader response modifier.
 We can use a block to specify the downloader response modifier. But Using protocol can make this extensible, and allow Swift user to use it easily instead of using `@convention(block)` to store a block into context options.
 */
@protocol SDWebImageDownloaderResponseModifier <NSObject>

/// Modify the original URL response and return a new response. You can use this to check MIME-Type, mock server response, etc.
/// @param response The original URL response, note for HTTP request it's actually a `NSHTTPURLResponse` instance
/// @note If nil is returned, the image download will marked as cancelled with error `SDWebImageErrorInvalidDownloadResponse`
- (nullable NSURLResponse *)modifiedResponseWithResponse:(nonnull NSURLResponse *)response;

@end

/**
 A downloader response modifier class with block.
 */
@interface SDWebImageDownloaderResponseModifier : NSObject <SDWebImageDownloaderResponseModifier>

/// Create the response modifier with block
/// @param block A block to control modifier logic
- (nonnull instancetype)initWithBlock:(nonnull SDWebImageDownloaderResponseModifierBlock)block;

/// Create the response modifier with block
/// @param block A block to control modifier logic
+ (nonnull instancetype)responseModifierWithBlock:(nonnull SDWebImageDownloaderResponseModifierBlock)block;

@end

/**
A convenient response modifier to provide the HTTP response including HTTP Status Code, Version and Headers.
*/
@interface SDWebImageDownloaderResponseModifier (Conveniences)

/// Create the response modifier with HTTP Status code.
/// @param statusCode HTTP Status Code.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithStatusCode:(NSInteger)statusCode;

/// Create the response modifier with HTTP Version. Status code defaults to 200.
/// @param version HTTP Version, nil means "HTTP/1.1".
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithVersion:(nullable NSString *)version;

/// Create the response modifier with HTTP Headers. Status code defaults to 200.
/// @param headers HTTP Headers. Case insensitive according to HTTP/1.1(HTTP/2) standard. The headers will override the same fields from original response.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithHeaders:(nullable NSDictionary<NSString *, NSString *> *)headers;

/// Create the response modifier with HTTP Status Code, Version and Headers.
/// @param statusCode HTTP Status Code.
/// @param version HTTP Version, nil means "HTTP/1.1".
/// @param headers HTTP Headers. Case insensitive according to HTTP/1.1(HTTP/2) standard. The headers will override the same fields from original response.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithStatusCode:(NSInteger)statusCode version:(nullable NSString *)version headers:(nullable NSDictionary<NSString *, NSString *> *)headers;

@end
