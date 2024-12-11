// Copyright 2024-present 650 Industries. All rights reserved.

#import "EXNotificationObjcWrapper.h"

@implementation EXNotificationObjcWrapper

/**
 Wrapper that allows Swift code to execute Objective-C code that could throw an NSException, which is not catchable by Swift.
 */
+ (BOOL)tryExecute:(nonnull void(NS_NOESCAPE^)(void))tryBlock error:(__autoreleasing NSError * _Nullable * _Nullable)error {
   @try {
      tryBlock();
      return YES;
   }
   @catch (NSException *exception) {
      NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
      if (exception.userInfo != NULL) {
         userInfo = [[NSMutableDictionary alloc] initWithDictionary:exception.userInfo];
      }
      if (exception.reason != nil) {
         if (![userInfo.allKeys containsObject:NSLocalizedFailureReasonErrorKey]) {
            [userInfo setObject:exception.reason forKey:NSLocalizedFailureReasonErrorKey];
         }
      }
     *error = (NSError *)exception;
      return NO;
   }
}

@end
