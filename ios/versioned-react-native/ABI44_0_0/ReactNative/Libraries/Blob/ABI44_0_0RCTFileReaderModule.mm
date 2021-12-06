/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import <ABI44_0_0React/ABI44_0_0RCTFileReaderModule.h>

#import <ABI44_0_0FBReactNativeSpec/ABI44_0_0FBReactNativeSpec.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>

#import <ABI44_0_0React/ABI44_0_0RCTBlobManager.h>

#import "ABI44_0_0RCTBlobPlugins.h"

@interface ABI44_0_0RCTFileReaderModule() <ABI44_0_0NativeFileReaderModuleSpec>
@end

@implementation ABI44_0_0RCTFileReaderModule

ABI44_0_0RCT_EXPORT_MODULE(FileReaderModule)

@synthesize bridge = _bridge;
@synthesize turboModuleRegistry = _turboModuleRegistry;

ABI44_0_0RCT_EXPORT_METHOD(readAsText:(NSDictionary<NSString *, id> *)blob
                  encoding:(NSString *)encoding
                  resolve:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI44_0_0RCTPromiseRejectBlock)reject)
{
  ABI44_0_0RCTBlobManager *blobManager = [[self bridge] moduleForClass:[ABI44_0_0RCTBlobManager class]];
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(ABI44_0_0RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [ABI44_0_0RCTConvert NSString:blob[@"blobId"]]], nil);
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

ABI44_0_0RCT_EXPORT_METHOD(readAsDataURL:(NSDictionary<NSString *, id> *)blob
                  resolve:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI44_0_0RCTPromiseRejectBlock)reject)
{
  ABI44_0_0RCTBlobManager *blobManager = nil;
  if ([self bridge]) {
    blobManager = [[self bridge] moduleForClass:[ABI44_0_0RCTBlobManager class]];
  } else {
    blobManager = [[self turboModuleRegistry] moduleForName:[NSStringFromClass([ABI44_0_0RCTBlobManager class]) UTF8String]];
  }
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(ABI44_0_0RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [ABI44_0_0RCTConvert NSString:blob[@"blobId"]]], nil);
  } else {
    NSString *type = [ABI44_0_0RCTConvert NSString:blob[@"type"]];
    NSString *text = [NSString stringWithFormat:@"data:%@;base64,%@",
                      type != nil && [type length] > 0 ? type : @"application/octet-stream",
                      [data base64EncodedStringWithOptions:0]];

    resolve(text);
  }
}

- (std::shared_ptr<ABI44_0_0facebook::ABI44_0_0React::TurboModule>)getTurboModule:(const ABI44_0_0facebook::ABI44_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI44_0_0facebook::ABI44_0_0React::NativeFileReaderModuleSpecJSI>(params);
}

@end

Class ABI44_0_0RCTFileReaderModuleCls(void)
{
  return ABI44_0_0RCTFileReaderModule.class;
}
