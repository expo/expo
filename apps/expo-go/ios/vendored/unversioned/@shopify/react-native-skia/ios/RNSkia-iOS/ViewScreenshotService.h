#pragma once

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTUIManager.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkImage.h"

#pragma clang diagnostic pop

@interface ViewScreenshotService : NSObject {
}

- (instancetype)initWithUiManager:(RCTUIManager *)uiManager;
- (sk_sp<SkImage>)screenshotOfViewWithTag:(NSNumber *)viewTag;

@end
