//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <EXUpdatesInterface/EXUpdatesExternalInterface.h>

/**
 * Simple singleton registry that holds a reference to a single controller implementing
 * EXUpdatesExternalInterface. This allows modules (like expo-dev-launcher) to acccess such a
 * controller without their podspec needing to declare a dependency on expo-updates.
 */
@interface EXUpdatesControllerRegistry : NSObject

@property (nonatomic, weak) id<EXUpdatesExternalInterface> controller;

+ (instancetype)sharedInstance;

@end
