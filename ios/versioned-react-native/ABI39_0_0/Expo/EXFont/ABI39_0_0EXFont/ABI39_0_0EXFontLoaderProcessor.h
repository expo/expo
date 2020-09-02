// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMFontInterface/ABI39_0_0UMFontProcessorInterface.h>
#import <ABI39_0_0EXFont/ABI39_0_0EXFontManager.h>

@interface ABI39_0_0EXFontLoaderProcessor : NSObject <ABI39_0_0UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(ABI39_0_0EXFontManager *)manager;

- (instancetype)initWithManager:(ABI39_0_0EXFontManager *)manager;

@end
