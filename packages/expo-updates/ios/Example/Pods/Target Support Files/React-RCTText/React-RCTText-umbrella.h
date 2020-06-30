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

#import "RCTBaseTextShadowView.h"
#import "RCTBaseTextViewManager.h"
#import "RCTRawTextShadowView.h"
#import "RCTRawTextViewManager.h"
#import "RCTConvert+Text.h"
#import "RCTTextAttributes.h"
#import "RCTTextTransform.h"
#import "NSTextStorage+FontScaling.h"
#import "RCTTextShadowView.h"
#import "RCTTextView.h"
#import "RCTTextViewManager.h"
#import "RCTMultilineTextInputView.h"
#import "RCTMultilineTextInputViewManager.h"
#import "RCTUITextView.h"
#import "RCTBackedTextInputDelegate.h"
#import "RCTBackedTextInputDelegateAdapter.h"
#import "RCTBackedTextInputViewProtocol.h"
#import "RCTBaseTextInputShadowView.h"
#import "RCTBaseTextInputView.h"
#import "RCTBaseTextInputViewManager.h"
#import "RCTInputAccessoryShadowView.h"
#import "RCTInputAccessoryView.h"
#import "RCTInputAccessoryViewContent.h"
#import "RCTInputAccessoryViewManager.h"
#import "RCTTextSelection.h"
#import "RCTSinglelineTextInputView.h"
#import "RCTSinglelineTextInputViewManager.h"
#import "RCTUITextField.h"
#import "RCTVirtualTextShadowView.h"
#import "RCTVirtualTextViewManager.h"

FOUNDATION_EXPORT double RCTTextVersionNumber;
FOUNDATION_EXPORT const unsigned char RCTTextVersionString[];

