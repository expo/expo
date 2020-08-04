// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMFontInterface/ABI37_0_0UMFontProcessorInterface.h>
#import <ABI37_0_0EXFont/ABI37_0_0EXFontManager.h>

@interface ABI37_0_0EXFontLoaderProcessor : NSObject <ABI37_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI37_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI37_0_0EXFontManager *)manager;

@end
