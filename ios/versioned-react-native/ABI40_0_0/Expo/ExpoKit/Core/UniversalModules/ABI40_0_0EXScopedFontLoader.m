// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXFont/ABI40_0_0EXFontLoader.h>)
#import "ABI40_0_0EXScopedFontLoader.h"
#import "ABI40_0_0EXConstantsBinding.h"
#import <ABI40_0_0UMConstantsInterface/ABI40_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI40_0_0EXFontFamilyPrefix = @"ExpoFont-";

@implementation ABI40_0_0EXScopedFontLoader

- (instancetype)init {
  return [super initWithFontFamilyPrefix:ABI40_0_0EXFontFamilyPrefix];
}

@end

NS_ASSUME_NONNULL_END

#endif
