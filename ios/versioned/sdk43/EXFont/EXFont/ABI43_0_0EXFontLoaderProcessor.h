// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFontProcessorInterface.h>
#import <ABI43_0_0EXFont/ABI43_0_0EXFontManager.h>

@interface ABI43_0_0EXFontLoaderProcessor : NSObject <ABI43_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI43_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI43_0_0EXFontManager *)manager;

@end
