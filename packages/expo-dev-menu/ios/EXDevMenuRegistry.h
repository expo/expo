//
//  EXDevMenuInstanceRegistry.h
//  Pods
//
//  Created by andrew on 2022-01-20.
//

#import "EXDevMenuInstance.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXDevMenuRegistry : NSObject

+ (instancetype)sharedInstance;
+ (void)registerWithBridge:(RCTBridge *)bridge;
+ (void)removeBridge:(RCTBridge *)bridge;
+ (EXDevMenuInstance *)getInstanceForBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
