// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSegment/EXSegment.h>)
#import <EXSegment/EXSegment.h>
#import <UMCore/UMModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedSegment : EXSegment <UMModuleRegistryConsumer>

@end

NS_ASSUME_NONNULL_END
#endif
