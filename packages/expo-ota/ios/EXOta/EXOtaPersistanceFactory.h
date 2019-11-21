//
//  EXOtaPersistanceFactory.h
//  EXOta
//
//  Created by Michał Czernek on 11/10/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaPersistance.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaPersistanceFactory : NSObject

- (EXOtaPersistance *)persistanceForId:(NSString * _Nullable)identifier createIfNeeded:(BOOL)create;

+ (id) sharedFactory;

@end

NS_ASSUME_NONNULL_END
