/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

typedef NSURLRequest * _Nullable (^SDWebImageDownloaderRequestModifierBlock)(NSURLRequest * _Nonnull request);

/**
 This is the protocol for downloader request modifier.
 We can use a block to specify the downloader request modifier. But Using protocol can make this extensible, and allow Swift user to use it easily instead of using `@convention(block)` to store a block into context options.
 */
@protocol SDWebImageDownloaderRequestModifier <NSObject>

/// Modify the original URL request and return a new one instead. You can modify the HTTP header, cachePolicy, etc for this URL.
/// @param request The original URL request for image loading
/// @note If return nil, the URL request will be cancelled.
- (nullable NSURLRequest *)modifiedRequestWithRequest:(nonnull NSURLRequest *)request;

@end

/**
 A downloader request modifier class with block.
 */
@interface SDWebImageDownloaderRequestModifier : NSObject <SDWebImageDownloaderRequestModifier>

/// Create the request modifier with block
/// @param block A block to control modifier logic
- (nonnull instancetype)initWithBlock:(nonnull SDWebImageDownloaderRequestModifierBlock)block;

/// Create the request modifier with block
/// @param block A block to control modifier logic
+ (nonnull instancetype)requestModifierWithBlock:(nonnull SDWebImageDownloaderRequestModifierBlock)block;

@end

/**
A convenient request modifier to provide the HTTP request including HTTP Method, Headers and Body.
*/
@interface SDWebImageDownloaderRequestModifier (Conveniences)

/// Create the request modifier with HTTP Method.
/// @param method HTTP Method, nil means to GET.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithMethod:(nullable NSString *)method;

/// Create the request modifier with HTTP Headers.
/// @param headers HTTP Headers. Case insensitive according to HTTP/1.1(HTTP/2) standard. The headers will override the same fields from original request.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithHeaders:(nullable NSDictionary<NSString *, NSString *> *)headers;

/// Create the request modifier with HTTP Body.
/// @param body HTTP Body.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithBody:(nullable NSData *)body;

/// Create the request modifier with HTTP Method, Headers and Body.
/// @param method HTTP Method, nil means to GET.
/// @param headers HTTP Headers. Case insensitive according to HTTP/1.1(HTTP/2) standard. The headers will override the same fields from original request.
/// @param body HTTP Body.
/// @note This is for convenience, if you need code to control the logic, use block API instead.
- (nonnull instancetype)initWithMethod:(nullable NSString *)method headers:(nullable NSDictionary<NSString *, NSString *> *)headers body:(nullable NSData *)body;

@end
