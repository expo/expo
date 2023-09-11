// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXFontProcessorInterface.h>
#import <ABI47_0_0EXFont/ABI47_0_0EXFontManager.h>

@interface ABI47_0_0EXFontLoaderProcessor : NSObject <ABI47_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI47_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI47_0_0EXFontManager *)manager;

@end
