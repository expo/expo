// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMFontInterface/ABI36_0_0UMFontProcessorInterface.h>
#import <ABI36_0_0EXFont/ABI36_0_0EXFontManager.h>

@interface ABI36_0_0EXFontLoaderProcessor : NSObject <ABI36_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI36_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI36_0_0EXFontManager *)manager;

@end
