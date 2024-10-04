// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Private header that should only be used by EXUpdatesManager kernel service
 */

@interface EXAbstractLoader ()

@property (nonatomic, readonly, nullable) EXUpdatesConfig *config;
@property (nonatomic, readonly, nullable) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly, nullable) id<EXUpdatesAppLauncher> appLauncher;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;

@end

NS_ASSUME_NONNULL_END
