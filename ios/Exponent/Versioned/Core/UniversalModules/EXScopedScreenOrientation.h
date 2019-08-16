// Copyright © 2018-present 650 Industries. All rights reserved.


#import <Foundation/Foundation.h>
#import <EXScreenOrientation/EXScreenOrientationModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedScreenOrientation : EXScreenOrientationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
