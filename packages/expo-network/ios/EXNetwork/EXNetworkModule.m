// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXNetwork/EXNetworkModule.h>

#import <ifaddrs.h>
#import <arpa/inet.h>

@interface EXNetworkModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXNetworkModule

UM_EXPORT_MODULE(ExpoNetwork);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}


UM_EXPORT_METHOD_AS(getMacAddressAsync,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  //some iOS privacy issues
  NSString *address = @"02:00:00:00:00:00";
  resolve(address);
}

UM_EXPORT_METHOD_AS(getIpAddressAsync,
                    getIpAddressAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
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
    reject(@"E_NO_IFADDRS", @"No network interfaces could be retrieved.", nil);
  }
  
  // Free memory
  freeifaddrs(interfaces);
}

@end
