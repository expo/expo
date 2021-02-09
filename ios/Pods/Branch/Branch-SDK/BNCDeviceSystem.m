//
//  BNCDeviceSystem.m
//  Branch
//
//  Created by Ernest Cho on 11/14/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCDeviceSystem.h"
#import <sys/sysctl.h>
#import <mach/machine.h>

@implementation BNCDeviceSystem

- (instancetype)init {
    self = [super init];
    if (self) {
        [self loadSystemInformation];
        [self loadCPUTypeInfo];
    }
    return self;
}

- (void)loadSystemInformation {
    self.systemBuildVersion = [self systemInformationForName:@"kern.osversion"];
    self.machine = [self systemInformationForName:@"hw.machine"];
}

// only for string information
- (NSString *)systemInformationForName:(NSString *)name {
    NSString *value = nil;
    if (name) {
        const char *cstring = [name cStringUsingEncoding:NSUTF8StringEncoding];
        
        // check size of info
        size_t size;
        sysctlbyname(cstring, NULL, &size, NULL, 0);
        
        // load info
        char *buffer = malloc(size);
        sysctlbyname(cstring, buffer, &size, NULL, 0);

        // create NSString with c string, free the malloc'd c string after
        value = @(buffer);
        free(buffer);
    }
    
    return value;
}

- (void)loadCPUTypeInfo {
    size_t size;
    cpu_type_t type;
    cpu_subtype_t subtype;
    
    size = sizeof(type);
    sysctlbyname("hw.cputype", &type, &size, NULL, 0);
    self.cpuType = @(type);
    
    size = sizeof(subtype);
    sysctlbyname("hw.cpusubtype", &subtype, &size, NULL, 0);
    self.cpuSubType = @(subtype);
}

@end
