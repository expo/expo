//  Copyright © 2022-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdatesInterface/ABI47_0_0EXUpdatesExternalInterface.h>

/**
 * Simple singleton registry that holds a reference to a single controller implementing
 * ABI47_0_0EXUpdatesExternalInterface. This allows modules (like expo-dev-launcher) to acccess such a
 * controller without their podspec needing to declare a dependency on expo-updates.
 */
@interface ABI47_0_0EXUpdatesControllerRegistry : NSObject

@property (nonatomic, weak) id<ABI47_0_0EXUpdatesExternalInterface> controller;

+ (instancetype)sharedInstance;

@end
