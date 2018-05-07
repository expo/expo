// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXAppFetcher.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXAppFetcher ()

@property (nonatomic, weak) EXAppLoader *appLoader;

@property (nonatomic, strong) NSDictionary * _Nullable manifest;
@property (nonatomic, strong) NSData * _Nullable bundle;
@property (nonatomic, strong) NSError * _Nullable error;

@end

NS_ASSUME_NONNULL_END

