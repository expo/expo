// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMFontInterface/UMFontProcessorInterface.h>
#import <EXFont/EXFontManager.h>

@interface EXFontLoaderProcessor : NSObject <UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(EXFontManager *)manager;

- (instancetype)initWithManager:(EXFontManager *)manager;

@end
