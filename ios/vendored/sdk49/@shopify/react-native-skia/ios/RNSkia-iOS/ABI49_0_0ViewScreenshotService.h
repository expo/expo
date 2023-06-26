#pragma once

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkImage.h"

#pragma clang diagnostic pop

@interface ABI49_0_0ViewScreenshotService : NSObject {
}

- (instancetype)initWithUiManager:(ABI49_0_0RCTUIManager *)uiManager;
- (sk_sp<SkImage>)screenshotOfViewWithTag:(NSNumber *)viewTag;

@end
