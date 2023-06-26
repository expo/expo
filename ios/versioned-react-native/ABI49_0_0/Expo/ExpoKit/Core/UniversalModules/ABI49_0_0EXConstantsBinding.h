// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#if __has_include(<ABI49_0_0EXConstants/ABI49_0_0EXConstantsService.h>)
#import <ABI49_0_0EXConstants/ABI49_0_0EXConstantsService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXConstantsBinding : ABI49_0_0EXConstantsService <ABI49_0_0EXInternalModule, ABI49_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;

- (instancetype)initWithParams:(NSDictionary *)params;

@end

NS_ASSUME_NONNULL_END

#endif
