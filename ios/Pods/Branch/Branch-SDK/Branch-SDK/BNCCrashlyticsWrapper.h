//
//  BNCCrashlyticsWrapper.h
//  Branch.framework
//
//  Created by Jimmy Dee on 7/18/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

/**
 * Convenience class to dynamically wrap the Crashlytics SDK
 * if present. If it is not present, everything here is a no-op.
 */
@interface BNCCrashlyticsWrapper : NSObject

/// Reference to the Crashlytics.sharedInstance or nil.
@property (nonatomic, nullable, readonly) id crashlytics;

/// Convenience method to create new instances
+ (instancetype _Nonnull)wrapper;

/**
 * Use these methods to set key values in a Crashlytics report.
 */
- (void)setObjectValue:(id _Nullable)value forKey:(NSString * _Nonnull)key;
- (void)setIntValue:(int)value forKey:(NSString * _Nonnull)key;
- (void)setBoolValue:(BOOL)value forKey:(NSString * _Nonnull)key;
- (void)setFloatValue:(float)value forKey:(NSString * _Nonnull)key;
@end
