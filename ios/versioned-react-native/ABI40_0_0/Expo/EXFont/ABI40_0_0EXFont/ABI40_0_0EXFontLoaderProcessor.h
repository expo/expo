// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMFontInterface/ABI40_0_0UMFontProcessorInterface.h>
#import <ABI40_0_0EXFont/ABI40_0_0EXFontManager.h>

@interface ABI40_0_0EXFontLoaderProcessor : NSObject <ABI40_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI40_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI40_0_0EXFontManager *)manager;

@end
