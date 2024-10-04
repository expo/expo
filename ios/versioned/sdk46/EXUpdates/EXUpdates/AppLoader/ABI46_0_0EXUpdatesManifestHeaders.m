//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesManifestHeaders.h>

@implementation ABI46_0_0EXUpdatesManifestHeaders

- (instancetype)initWithProtocolVersion:(nullable NSString *)protocolVersion
                   serverDefinedHeaders:(nullable NSString *)serverDefinedHeaders
                        manifestFilters:(nullable NSString *)manifestFilters
                      manifestSignature:(nullable NSString *)manifestSignature
                              signature:(nullable NSString *)signature {
  if (self = [super init]) {
    _protocolVersion = protocolVersion;
    _serverDefinedHeaders = serverDefinedHeaders;
    _manifestFilters = manifestFilters;
    _manifestSignature = manifestSignature;
    _signature = signature;
  }
  return self;
}

@end
