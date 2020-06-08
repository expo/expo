// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMFontInterface/ABI38_0_0UMFontProcessorInterface.h>
#import <ABI38_0_0EXFont/ABI38_0_0EXFontManager.h>

@interface ABI38_0_0EXFontLoaderProcessor : NSObject <ABI38_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI38_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI38_0_0EXFontManager *)manager;

@end
