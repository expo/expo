// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXFont/EXFontLoader.h>)
#import <EXFont/EXFontLoader.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFontLoader : EXFontLoader <UMModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
#endif
