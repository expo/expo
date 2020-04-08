/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import <Foundation/Foundation.h>
#import "SDWebImageCompat.h"

typedef NSData * _Nullable (^SDWebImageDownloaderDecryptorBlock)(NSData * _Nonnull data, NSURLResponse * _Nullable response);

/**
This is the protocol for downloader decryptor. Which decrypt the original encrypted data before decoding. Note progressive decoding is not compatible for decryptor.
We can use a block to specify the downloader decryptor. But Using protocol can make this extensible, and allow Swift user to use it easily instead of using `@convention(block)` to store a block into context options.
*/
@protocol SDWebImageDownloaderDecryptor <NSObject>

/// Decrypt the original download data and return a new data. You can use this to decrypt the data using your perfereed algorithm.
/// @param data The original download data
/// @param response The URL response for data. If you modifiy the original URL response via response modifier, the modified version will be here. This arg is nullable.
/// @note If nil is returned, the image download will be marked as failed with error `SDWebImageErrorBadImageData`
- (nullable NSData *)decryptedDataWithData:(nonnull NSData *)data response:(nullable NSURLResponse *)response;

@end

/**
A downloader response modifier class with block.
*/
@interface SDWebImageDownloaderDecryptor : NSObject <SDWebImageDownloaderDecryptor>

- (nonnull instancetype)initWithBlock:(nonnull SDWebImageDownloaderDecryptorBlock)block;
+ (nonnull instancetype)decryptorWithBlock:(nonnull SDWebImageDownloaderDecryptorBlock)block;

@end

/// Convenience way to create decryptor for common data encryption.
@interface SDWebImageDownloaderDecryptor (Conveniences)

/// Base64 Encoded image data decryptor
@property (class, readonly, nonnull) SDWebImageDownloaderDecryptor *base64Decryptor;

@end
