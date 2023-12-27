// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXFontProcessorInterface.h>
#import <ABI42_0_0EXFont/ABI42_0_0EXFontManager.h>

@interface ABI42_0_0EXFontLoaderProcessor : NSObject <ABI42_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI42_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI42_0_0EXFontManager *)manager;

@end
