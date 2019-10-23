// Copyright © 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXScreenOrientation/EXScreenOrientationModule.h>)
#import <Foundation/Foundation.h>
#import <EXScreenOrientation/EXScreenOrientationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedScreenOrientation : EXScreenOrientationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end
#endif

NS_ASSUME_NONNULL_END
