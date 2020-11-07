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

#import "RCTText/RCTBaseTextShadowView.h"
#import "RCTText/RCTBaseTextViewManager.h"
#import "RCTText/RCTRawTextShadowView.h"
#import "RCTText/RCTRawTextViewManager.h"
#import "RCTText/RCTConvert+Text.h"
#import "RCTText/RCTTextAttributes.h"
#import "RCTText/RCTTextTransform.h"
#import "RCTText/NSTextStorage+FontScaling.h"
#import "RCTText/RCTTextShadowView.h"
#import "RCTText/RCTTextView.h"
#import "RCTText/RCTTextViewManager.h"
#import "RCTText/RCTMultilineTextInputView.h"
#import "RCTText/RCTMultilineTextInputViewManager.h"
#import "RCTText/RCTUITextView.h"
#import "RCTText/RCTBackedTextInputDelegate.h"
#import "RCTText/RCTBackedTextInputDelegateAdapter.h"
#import "RCTText/RCTBackedTextInputViewProtocol.h"
#import "RCTText/RCTBaseTextInputShadowView.h"
#import "RCTText/RCTBaseTextInputView.h"
#import "RCTText/RCTBaseTextInputViewManager.h"
#import "RCTText/RCTInputAccessoryShadowView.h"
#import "RCTText/RCTInputAccessoryView.h"
#import "RCTText/RCTInputAccessoryViewContent.h"
#import "RCTText/RCTInputAccessoryViewManager.h"
#import "RCTText/RCTTextSelection.h"
#import "RCTText/RCTSinglelineTextInputView.h"
#import "RCTText/RCTSinglelineTextInputViewManager.h"
#import "RCTText/RCTUITextField.h"
#import "RCTText/RCTVirtualTextShadowView.h"
#import "RCTText/RCTVirtualTextViewManager.h"

FOUNDATION_EXPORT double RCTTextVersionNumber;
FOUNDATION_EXPORT const unsigned char RCTTextVersionString[];

