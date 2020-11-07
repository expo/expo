#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "EXBarCodeCameraRequester.h"
#import "EXBarCodeScanner.h"
#import "EXBarCodeScannerModule.h"
#import "EXBarCodeScannerProvider.h"
#import "EXBarCodeScannerView.h"
#import "EXBarCodeScannerViewManager.h"
#import "EXBarCodeScannerUtils.h"

FOUNDATION_EXPORT double EXBarCodeScannerVersionNumber;
FOUNDATION_EXPORT const unsigned char EXBarCodeScannerVersionString[];

