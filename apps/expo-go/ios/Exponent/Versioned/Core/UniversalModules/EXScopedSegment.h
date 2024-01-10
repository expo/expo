// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSegment/EXSegment.h>)
#import <EXSegment/EXSegment.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedSegment : EXSegment <EXModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
#endif
