//
//  RNBranchEventEmitter.h
//  Pods
//
//  Created by Jimmy Dee on 4/6/17.
//
//  Based on https://gist.github.com/andybangs/c4651a3916ebde0df1c977b220bbec4b

#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>

extern NSString * const _Nonnull kRNBranchInitSessionStart;
extern NSString * const _Nonnull kRNBranchInitSessionSuccess;
extern NSString * const _Nonnull kRNBranchInitSessionError;

@interface RNBranchEventEmitter : RCTEventEmitter<RCTBridgeModule>

+ (void)initSessionWillStartWithURI:(NSURL * __nullable)uri;
+ (void)initSessionDidSucceedWithPayload:(NSDictionary<NSString *, id> * __nullable)payload;
+ (void)initSessionDidEncounterErrorWithPayload:(NSDictionary<NSString *, id> * __nullable)payload;

@end
