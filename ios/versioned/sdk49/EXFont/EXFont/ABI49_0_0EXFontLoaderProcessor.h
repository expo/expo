// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXFontProcessorInterface.h>
#import <ABI49_0_0EXFont/ABI49_0_0EXFontManager.h>

@interface ABI49_0_0EXFontLoaderProcessor : NSObject <ABI49_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI49_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI49_0_0EXFontManager *)manager;

@end
