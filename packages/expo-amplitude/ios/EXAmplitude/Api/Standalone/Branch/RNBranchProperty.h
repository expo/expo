//
//  RNBranchProperty.h
//  RNBranch
//
//  Created by Jimmy Dee on 1/26/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Branch/Branch.h>

/*
 * Utility class to represent dynamically all supported JS properties on BranchUniversalObject and BranchLinkProperties.
 */
@interface RNBranchProperty : NSObject
@property (nonatomic, nonnull) SEL setterSelector;
@property (nonatomic, nonnull) Class type;

+ (instancetype _Nonnull) propertyWithSetterSelector:(SEL _Nonnull)selector type:(Class _Nonnull)type;

- (instancetype _Nonnull) initWithSetterSelector:(SEL _Nonnull)selector type:(Class _Nonnull)type NS_DESIGNATED_INITIALIZER;
- (instancetype _Nonnull)init NS_UNAVAILABLE;

- (BOOL)isEqual:(id _Nullable )object;

@end
