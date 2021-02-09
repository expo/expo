// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXFont/ABI38_0_0EXFontLoader.h>)
#import "ABI38_0_0EXScopedFontLoader.h"
#import "ABI38_0_0EXConstantsBinding.h"
#import <ABI38_0_0UMConstantsInterface/ABI38_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI38_0_0EXFontFamilyPrefix = @"ExpoFont-";

@implementation ABI38_0_0EXScopedFontLoader

- (instancetype)init {
  return [super initWithFontFamilyPrefix:ABI38_0_0EXFontFamilyPrefix];
}

@end

NS_ASSUME_NONNULL_END

#endif
