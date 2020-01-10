// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@protocol UMJavaScriptContextProvider <NSObject>

- (JSGlobalContextRef)javaScriptContextRef;
- (long)javaScriptRuntimePtr;

@end
