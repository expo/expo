

#import <Foundation/Foundation.h>
#import <Firebase.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseAuth : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@property NSMutableDictionary *authStateHandlers;
@property NSMutableDictionary *idTokenHandlers;

@end
