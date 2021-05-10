// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXFont/ABI39_0_0EXFontLoader.h>)
#import "ABI39_0_0EXScopedFontLoader.h"
#import "ABI39_0_0EXConstantsBinding.h"
#import <ABI39_0_0UMConstantsInterface/ABI39_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI39_0_0EXFontFamilyPrefix = @"ExpoFont-";

@implementation ABI39_0_0EXScopedFontLoader

- (instancetype)init {
  return [super initWithFontFamilyPrefix:ABI39_0_0EXFontFamilyPrefix];
}

@end

NS_ASSUME_NONNULL_END

#endif
