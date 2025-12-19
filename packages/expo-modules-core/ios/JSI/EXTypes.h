// Copyright 2024-present 650 Industries. All rights reserved.

#pragma once

#import <Foundation/Foundation.h>

// Common types used across ExpoModulesJSI and ExpoModulesCore
// This header has no dependencies on either product to avoid cycles.

typedef void (NS_SWIFT_SENDABLE ^EXPromiseResolveBlock)(id _Nullable result);
typedef void (NS_SWIFT_SENDABLE ^EXPromiseRejectBlock)(NSString * _Nullable code, NSString * _Nullable message, NSError * _Nullable error);
