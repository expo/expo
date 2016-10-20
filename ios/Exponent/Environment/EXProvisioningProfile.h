// Copyright 2015-present 650 Industries. All rights reserved.

@import Foundation;

@interface EXProvisioningProfile : NSObject

+ (instancetype)mainProvisioningProfile;

@property (nonatomic, readonly, getter=isDevelopment) BOOL development;

@end
