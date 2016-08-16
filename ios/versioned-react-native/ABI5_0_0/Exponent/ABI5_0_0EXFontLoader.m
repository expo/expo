// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI5_0_0EXFontLoader.h"

@import CoreGraphics;
@import CoreText;
@import Foundation;
@import UIKit;

@implementation ABI5_0_0EXFontLoader

// TODO: Move this into a separate module instead of tying it tightly to Exponent,
// but its OK for now

+ (NSMutableDictionary *)sharedFontURLRegistry
{
  static NSMutableDictionary *fontRegistry;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    fontRegistry = [NSMutableDictionary dictionary];
  });
  return fontRegistry;
}

ABI5_0_0RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("host.exp.Exponent.FontLoader", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

ABI5_0_0RCT_REMAP_METHOD(listFontsAsync, listFontsAsyncWithResolver:(ABI5_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI5_0_0RCTPromiseRejectBlock)reject) {
  
  NSMutableDictionary *fonts = [NSMutableDictionary dictionary];
  
  for (NSString* family in [UIFont familyNames]) {
    NSMutableArray *fontsInFamily = [NSMutableArray array];
    for (NSString *name in [UIFont fontNamesForFamilyName:family]) {
      [fontsInFamily addObject:name];
    }
    fonts[family] = fontsInFamily;
  }
  resolve(fonts);
}

ABI5_0_0RCT_EXPORT_METHOD(loadFontAsync:(NSURL *)url resolver:(ABI5_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI5_0_0RCTPromiseRejectBlock)reject)
{  
  NSMutableDictionary *registry = [ABI5_0_0EXFontLoader sharedFontURLRegistry];
  if (registry[url]) {
    resolve(registry[url]);
    return;
  }

  NSURLSessionConfiguration *sessionConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
  NSURLSession *session = [NSURLSession sessionWithConfiguration:sessionConfiguration];
  NSURLSessionDataTask *task = [session dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (error) {
      reject(@"E_FONT_DOWNLOAD_FAILED", @"Could not download the font data", error);
      return;
    }

    UIFont *font = [self _registerFontFromData:data error:&error];
    if (!font) {
      reject(@"E_FONT_REGISTRATION_FAILED", error.localizedDescription, error);
    }

    registry[url] = font.fontName;
    resolve(font.fontName);
  }];
  [task resume];
}

- (nullable UIFont *)_registerFontFromData:(NSData *)fontData error:(NSError **)error
{
  CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)fontData);
  CGFontRef font = CGFontCreateWithDataProvider(provider);
  CGDataProviderRelease(provider);

  if (!font) {
    if (error) {
      *error = [NSError errorWithDomain:@"host.exp" code:1011 userInfo:@{
        NSLocalizedDescriptionKey: @"Could not create font from loaded data",
      }];
    }
    return nil;
  }

  CFErrorRef registrationError;
  if (!CTFontManagerRegisterGraphicsFont(font, &registrationError)) {
    CGFontRelease(font);
    if (error) {
      *error = (__bridge_transfer NSError *)registrationError;
    }
    return nil;
  }

  UIFont *uiFont = (__bridge_transfer UIFont *)CTFontCreateWithGraphicsFont(font, 0, NULL, NULL);
  CGFontRelease(font);
  return uiFont;
}

@end
