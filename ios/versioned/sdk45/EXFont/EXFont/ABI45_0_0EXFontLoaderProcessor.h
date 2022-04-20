// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXFontProcessorInterface.h>
#import <ABI45_0_0EXFont/ABI45_0_0EXFontManager.h>

@interface ABI45_0_0EXFontLoaderProcessor : NSObject <ABI45_0_0EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI45_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI45_0_0EXFontManager *)manager;

@end
