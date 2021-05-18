// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXFontProcessorInterface.h>
#import <EXFont/EXFontManager.h>

@interface EXFontLoaderProcessor : NSObject <EXFontProcessorInterface>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix
                                 manager:(EXFontManager *)manager;

- (instancetype)initWithManager:(EXFontManager *)manager;

@end
