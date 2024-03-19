// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

@class EXUpdatesConfig;
@class EXUpdatesSelectionPolicy;
@protocol EXUpdatesAppLauncher;

NS_ASSUME_NONNULL_BEGIN

/**
 * Private header that should only be used by EXUpdatesManager kernel service
 */

@interface EXAbstractLoader ()

@property (nonatomic, readonly, nullable) EXUpdatesConfig *config;
@property (nonatomic, readonly, nullable) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly, nullable) id<EXUpdatesAppLauncher> appLauncher;

@end

NS_ASSUME_NONNULL_END
