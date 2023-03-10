// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFontProcessorInterface.h>
#import <ABI48_0_0EXFont/ABI48_0_0EXFontManager.h>

@interface ABI48_0_0EXFontLoaderProcessor : NSObject <ABI48_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI48_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI48_0_0EXFontManager *)manager;

@end
