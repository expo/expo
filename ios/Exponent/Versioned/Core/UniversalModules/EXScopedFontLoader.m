// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXFont/EXFontLoader.h>)
#import "EXScopedFontLoader.h"
#import "EXConstantsBinding.h"
#import <UMConstantsInterface/UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXFontFamilyPrefix = @"ExpoFont-";

@implementation EXScopedFontLoader

- (instancetype)init {
  return [super initWithFontFamilyPrefix:EXFontFamilyPrefix];
}

@end

NS_ASSUME_NONNULL_END

#endif
