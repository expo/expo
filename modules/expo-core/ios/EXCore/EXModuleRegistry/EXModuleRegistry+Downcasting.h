// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXModuleRegistry (Downcasting)

- (id)downcastInstance:(id)instance toProtocol:(Protocol *)protocol;

@end
