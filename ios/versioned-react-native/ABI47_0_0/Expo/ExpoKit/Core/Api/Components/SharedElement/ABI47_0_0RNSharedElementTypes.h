//
//  ABI47_0_0RNSharedElementTypes.h
//  ABI47_0_0React-native-shared-element
//

#ifndef ABI47_0_0RNSharedElementTypes_h
#define ABI47_0_0RNSharedElementTypes_h

typedef NS_ENUM(NSInteger, ABI47_0_0RNSharedElementContentType) {
    ABI47_0_0RNSharedElementContentTypeNone = 0,
    ABI47_0_0RNSharedElementContentTypeSnapshotView = 1,
    ABI47_0_0RNSharedElementContentTypeSnapshotImage = 2,
    ABI47_0_0RNSharedElementContentTypeRawImage = 3
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSharedElementAnimation) {
    ABI47_0_0RNSharedElementAnimationMove = 0,
    ABI47_0_0RNSharedElementAnimationFade = 1,
    ABI47_0_0RNSharedElementAnimationFadeIn = 2,
    ABI47_0_0RNSharedElementAnimationFadeOut = 3
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSharedElementResize) {
    ABI47_0_0RNSharedElementResizeAuto = 0,
    ABI47_0_0RNSharedElementResizeStretch = 1,
    ABI47_0_0RNSharedElementResizeClip = 2,
    ABI47_0_0RNSharedElementResizeNone = 3
};

typedef NS_ENUM(NSInteger, ABI47_0_0RNSharedElementAlign) {
    ABI47_0_0RNSharedElementAlignAuto = 0,
    ABI47_0_0RNSharedElementAlignLeftTop = 1,
    ABI47_0_0RNSharedElementAlignLeftCenter = 2,
    ABI47_0_0RNSharedElementAlignLeftBottom = 3,
    ABI47_0_0RNSharedElementAlignRightTop = 4,
    ABI47_0_0RNSharedElementAlignRightCenter = 5,
    ABI47_0_0RNSharedElementAlignRightBottom = 6,
    ABI47_0_0RNSharedElementAlignCenterTop = 7,
    ABI47_0_0RNSharedElementAlignCenterCenter = 8,
    ABI47_0_0RNSharedElementAlignCenterBottom = 9
};


#endif
