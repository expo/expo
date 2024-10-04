// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@protocol ABI42_0_0UMJavaScriptContextProvider <NSObject>

- (JSGlobalContextRef)javaScriptContextRef;
- (void *)javaScriptRuntimePointer;

@end
