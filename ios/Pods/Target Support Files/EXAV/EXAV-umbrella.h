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

#import "EXAudioRecordingPermissionRequester.h"
#import "EXAudioSessionManager.h"
#import "EXAV.h"
#import "EXAVObject.h"
#import "EXAVPlayerData.h"
#import "EXVideoManager.h"
#import "EXVideoPlayerViewController.h"
#import "EXVideoPlayerViewControllerDelegate.h"
#import "EXVideoView.h"

FOUNDATION_EXPORT double EXAVVersionNumber;
FOUNDATION_EXPORT const unsigned char EXAVVersionString[];

