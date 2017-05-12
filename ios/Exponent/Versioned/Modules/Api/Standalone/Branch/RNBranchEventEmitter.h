//
//  RNBranchEventEmitter.h
//  Pods
//
//  Created by Jimmy Dee on 4/6/17.
//
//  Based on https://gist.github.com/andybangs/c4651a3916ebde0df1c977b220bbec4b

#import <React/RCTEventEmitter.h>
#import <React/RCTBridge.h>

extern NSString * const RNBranchInitSessionSuccess;
extern NSString * const RNBranchInitSessionError;

@interface RNBranchEventEmitter : RCTEventEmitter<RCTBridgeModule>

+ (void)initSessionDidSucceedWithPayload:(NSDictionary<NSString *, id> *)payload;
+ (void)initSessionDidEncounterErrorWithPayload:(NSDictionary<NSString *, id> *)payload;

@end
