// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<EXConstants/EXConstantsService.h>)
#import <EXConstants/EXConstantsService.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXConstantsBinding : EXConstantsService <EXInternalModule, EXConstantsInterface>

- (instancetype)initWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
