// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMFontInterface/UMFontProcessorInterface.h>
#import "EXFontManager.h"

@interface EXFontLoaderProcessor : NSObject <UMFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                              andManager:(EXFontManager *)manager;

- (instancetype)initWithManager:(EXFontManager *)manager;

@end
