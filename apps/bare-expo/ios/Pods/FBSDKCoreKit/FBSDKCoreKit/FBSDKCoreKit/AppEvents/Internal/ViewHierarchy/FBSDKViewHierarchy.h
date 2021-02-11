// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

#import <UIKit/UIKit.h>

typedef NS_ENUM(NSUInteger, FBCodelessClassBitmask) {
    /** Indicates that the class is subclass of UIControl */
    FBCodelessClassBitmaskUIControl     = 1 << 3,
    /** Indicates that the class is subclass of UIControl */
    FBCodelessClassBitmaskUIButton      = 1 << 4,
    /** Indicates that the class is ReactNative Button */
    FBCodelessClassBitmaskReactNativeButton = 1 << 6,
    /** Indicates that the class is UITableViewCell */
    FBCodelessClassBitmaskUITableViewCell = 1 << 7,
    /** Indicates that the class is UICollectionViewCell */
    FBCodelessClassBitmaskUICollectionViewCell = 1 << 8,
    /** Indicates that the class is UILabel */
    FBCodelessClassBitmaskLabel = 1 << 10,
    /** Indicates that the class is UITextView or UITextField*/
    FBCodelessClassBitmaskInput = 1 << 11,
    /** Indicates that the class is UIPicker*/
    FBCodelessClassBitmaskPicker = 1 << 12,
    /** Indicates that the class is UISwitch*/
    FBCodelessClassBitmaskSwitch = 1 << 13,
    /** Indicates that the class is UIViewController*/
    FBCodelessClassBitmaskUIViewController = 1 << 17,
};

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(ViewHierarchy)
@interface FBSDKViewHierarchy : NSObject

+ (nullable NSObject *)getParent:(nullable NSObject *)obj;
+ (nullable NSArray<NSObject *> *)getChildren:(NSObject *)obj;
+ (nullable NSArray<NSObject *> *)getPath:(NSObject *)obj;
+ (nullable NSMutableDictionary<NSString *, id> *)getDetailAttributesOf:(NSObject *)obj;

+ (NSString *)getText:(nullable NSObject *)obj;
+ (NSString *)getHint:(nullable NSObject *)obj;
+ (nullable NSIndexPath *)getIndexPath:(NSObject *)obj;
+ (NSUInteger)getClassBitmask:(NSObject *)obj;
+ (nullable UITableView *)getParentTableView:(UIView *)cell;
+ (nullable UICollectionView *)getParentCollectionView:(UIView *)cell;
+ (NSInteger)getTag:(NSObject *)obj;
+ (nullable NSNumber *)getViewReactTag:(UIView *)view;

+ (nullable NSDictionary<NSString *, id> *)recursiveCaptureTreeWithCurrentNode:(NSObject *)currentNode
                                                                    targetNode:(nullable NSObject *)targetNode
                                                                 objAddressSet:(nullable NSMutableSet *)objAddressSet
                                                                          hash:(BOOL)hash;

+ (BOOL)isUserInputView:(NSObject *)obj;

@end

NS_ASSUME_NONNULL_END

#endif
