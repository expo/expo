/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import <ABI38_0_0React/ABI38_0_0RCTFileReaderModule.h>

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>

#import <ABI38_0_0React/ABI38_0_0RCTBlobManager.h>

#import "ABI38_0_0RCTBlobPlugins.h"

@interface ABI38_0_0RCTFileReaderModule() <NativeFileReaderModuleSpec>
@end

@implementation ABI38_0_0RCTFileReaderModule

ABI38_0_0RCT_EXPORT_MODULE(FileReaderModule)

@synthesize bridge = _bridge;

ABI38_0_0RCT_EXPORT_METHOD(readAsText:(NSDictionary<NSString *, id> *)blob
                  encoding:(NSString *)encoding
                  resolve:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI38_0_0RCTPromiseRejectBlock)reject)
{
  ABI38_0_0RCTBlobManager *blobManager = [[self bridge] moduleForClass:[ABI38_0_0RCTBlobManager class]];
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(ABI38_0_0RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [ABI38_0_0RCTConvert NSString:blob[@"blobId"]]], nil);
  } else {
    NSStringEncoding stringEncoding;

    if (encoding == nil) {
      stringEncoding = NSUTF8StringEncoding;
    } else {
      stringEncoding = CFStringConvertEncodingToNSStringEncoding(CFStringConvertIANACharSetNameToEncoding((CFStringRef) encoding));
    }

    NSString *text = [[NSString alloc] initWithData:data encoding:stringEncoding];

    resolve(text);
  }
}

ABI38_0_0RCT_EXPORT_METHOD(readAsDataURL:(NSDictionary<NSString *, id> *)blob
                  resolve:(ABI38_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI38_0_0RCTPromiseRejectBlock)reject)
{
  ABI38_0_0RCTBlobManager *blobManager = [[self bridge] moduleForClass:[ABI38_0_0RCTBlobManager class]];
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(ABI38_0_0RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [ABI38_0_0RCTConvert NSString:blob[@"blobId"]]], nil);
  } else {
    NSString *type = [ABI38_0_0RCTConvert NSString:blob[@"type"]];
    NSString *text = [NSString stringWithFormat:@"data:%@;base64,%@",
                      type != nil && [type length] > 0 ? type : @"application/octet-stream",
                      [data base64EncodedStringWithOptions:0]];

    resolve(text);
  }
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:
  (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeFileReaderModuleSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTFileReaderModuleCls(void)
{
  return ABI38_0_0RCTFileReaderModule.class;
}
