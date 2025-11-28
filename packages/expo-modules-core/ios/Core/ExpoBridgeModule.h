// Copyright 2024-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@class EXAppContext;

@interface ExpoBridgeModule : NSObject <RCTBridgeModule>

@property(nonatomic, nullable, strong) EXAppContext *appContext;

- (nonnull instancetype)initWithAppContext:(nonnull EXAppContext *)appContext;

@end
