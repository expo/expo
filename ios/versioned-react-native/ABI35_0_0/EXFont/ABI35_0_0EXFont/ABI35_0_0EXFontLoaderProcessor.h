// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI35_0_0UMFontInterface/ABI35_0_0UMFontProcessorInterface.h>
#import <ABI35_0_0EXFont/ABI35_0_0EXFontManager.h>

@interface ABI35_0_0EXFontLoaderProcessor : NSObject <ABI35_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI35_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI35_0_0EXFontManager *)manager;

@end
