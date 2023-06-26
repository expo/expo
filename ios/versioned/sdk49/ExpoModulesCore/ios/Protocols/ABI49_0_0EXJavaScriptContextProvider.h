// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@protocol ABI49_0_0EXJavaScriptContextProvider <NSObject>

- (JSGlobalContextRef)javaScriptContextRef;
- (void *)javaScriptRuntimePointer;

@end
