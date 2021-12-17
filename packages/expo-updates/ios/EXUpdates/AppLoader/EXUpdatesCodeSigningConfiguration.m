//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesCodeSigningConfiguration.h>

@implementation EXUpdatesCodeSigningConfiguration

- (instancetype)initWithCertificateString:(NSString *)certificateString
                                 metadata:(NSDictionary<NSString *, NSString *> *)metadata {
  if (self = [super init]) {
    _certificateString = certificateString;
    _metadata = metadata;
  }
  return self;
}

@end
