// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<ABI47_0_0EXConstants/ABI47_0_0EXConstantsService.h>)
#import <ABI47_0_0EXConstants/ABI47_0_0EXConstantsService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXConstantsBinding : ABI47_0_0EXConstantsService <ABI47_0_0EXInternalModule, ABI47_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
