//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesSelectionPolicyNewest : NSObject <EXUpdatesSelectionPolicy>

- (instancetype)initWithRuntimeVersion:(NSString *)runtimeVersion;

@end

NS_ASSUME_NONNULL_END
