// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFontProcessorInterface.h>
#import <ABI46_0_0EXFont/ABI46_0_0EXFontManager.h>

@interface ABI46_0_0EXFontLoaderProcessor : NSObject <ABI46_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI46_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI46_0_0EXFontManager *)manager;

@end
