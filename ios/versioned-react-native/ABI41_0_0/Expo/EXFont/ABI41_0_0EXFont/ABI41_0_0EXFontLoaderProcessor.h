// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMFontInterface/ABI41_0_0UMFontProcessorInterface.h>
#import <ABI41_0_0EXFont/ABI41_0_0EXFontManager.h>

@interface ABI41_0_0EXFontLoaderProcessor : NSObject <ABI41_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI41_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI41_0_0EXFontManager *)manager;

@end
