// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI45_0_0EXFont/ABI45_0_0EXFontLoader.h>)
#import "ABI45_0_0EXScopedFontLoader.h"
#import "ABI45_0_0EXConstantsBinding.h"
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI45_0_0EXFontFamilyPrefix = @"ExpoFont-";

@implementation ABI45_0_0EXScopedFontLoader

- (instancetype)init {
  return [super initWithFontFamilyPrefix:ABI45_0_0EXFontFamilyPrefix];
}

@end

NS_ASSUME_NONNULL_END

#endif
