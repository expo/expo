// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<ABI48_0_0EXConstants/ABI48_0_0EXConstantsService.h>)
#import <ABI48_0_0EXConstants/ABI48_0_0EXConstantsService.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXConstantsBinding : ABI48_0_0EXConstantsService <ABI48_0_0EXInternalModule, ABI48_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
