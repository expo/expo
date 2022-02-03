// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXNetwork/ABI43_0_0EXNetwork.h>
#import <SystemConfiguration/SystemConfiguration.h>

#import <ifaddrs.h>
#import <errno.h>
#import <arpa/inet.h>

@interface ABI43_0_0EXNetwork ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic) SCNetworkReachabilityRef reachabilityRef;
@property (nonatomic) SCNetworkReachabilityFlags lastFlags;
@property (nonatomic) NSString *type;

@end

@implementation ABI43_0_0EXNetwork

// Creates a new "blank" state
- (instancetype)init
{
  self = [super init];
  if (self) {
    _type = ABI43_0_0EXNetworkTypeUnknown;
  }
  return self;
}

ABI43_0_0EX_EXPORT_MODULE(ExpoNetwork);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI43_0_0EX_EXPORT_METHOD_AS(getIpAddressAsync,
                    getIpAddressAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSString *address = @"0.0.0.0";
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *temp_addr = NULL;
  int error = 0;
  // retrieve the current interfaces - On success, returns 0; on error, -1 is returned, and errno is set appropriately.
  error = getifaddrs(&interfaces);
  
  if (error == 0) {
    // Loop through linked list of interfaces
    temp_addr = interfaces;
    while(temp_addr != NULL) {
      if(temp_addr->ifa_addr->sa_family == AF_INET) {
        // Check if interface is en0 which is the wifi connection on the iPhone
        if([[NSString stringWithUTF8String:temp_addr->ifa_name] isEqualToString:@"en0"]) {
          // Get NSString from C String
          address = [NSString stringWithUTF8String:inet_ntoa(((struct sockaddr_in *)temp_addr->ifa_addr)->sin_addr)];
        }
      }
      temp_addr = temp_addr->ifa_next;
    }
    resolve(address);
  } else {
    NSString *errorMessage = [NSString stringWithFormat:@"%@/%d/%s",  @"No network interfaces could be retrieved. getifaddrs() failed with error number: ", errno, strerror(errno)];

    reject(@"ERR_NETWORK_IP_ADDRESS", errorMessage, nil);
  }
  
  // Free memory
  freeifaddrs(interfaces);
}

ABI43_0_0EX_EXPORT_METHOD_AS(getNetworkStateAsync,
                    getNetworkStateAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  _reachabilityRef =  [self createReachabilityRef];
  SCNetworkReachabilityFlags flags = [self lastFlags];
    
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    _type = ABI43_0_0EXNetworkTypeNone;
  }
  
#if !TARGET_OS_TV
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    _type = ABI43_0_0EXNetworkTypeCellular;
  }
#endif
  else {
    _type = ABI43_0_0EXNetworkTypeWifi;
  }
  
  resolve(@{
            @"type": [self type],
            @"isConnected": @([self connected]),
            @"isInternetReachable": @([self connected])
            });
}


- (SCNetworkReachabilityRef)createReachabilityRef
{
  struct sockaddr_in zeroAddress;
  bzero(&zeroAddress, sizeof(zeroAddress));
  zeroAddress.sin_len = sizeof(zeroAddress);
  zeroAddress.sin_family = AF_INET;
  
  SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);
  
  // Set the state the first time
  SCNetworkReachabilityFlags flags;
  SCNetworkReachabilityGetFlags(reachability, &flags);
  _lastFlags = flags;
  
  return reachability;
}

- (BOOL)connected
{
  return ![self.type isEqualToString:ABI43_0_0EXNetworkTypeUnknown] && ![self.type isEqualToString:ABI43_0_0EXNetworkTypeNone];
}

@end
