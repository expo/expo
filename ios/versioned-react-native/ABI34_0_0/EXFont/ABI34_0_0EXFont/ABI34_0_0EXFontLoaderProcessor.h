// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI34_0_0UMFontInterface/ABI34_0_0UMFontProcessorInterface.h>
#import <ABI34_0_0EXFont/ABI34_0_0EXFontManager.h>

@interface ABI34_0_0EXFontLoaderProcessor : NSObject <ABI34_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI34_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI34_0_0EXFontManager *)manager;

@end
