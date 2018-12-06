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
#ifndef FBSDKCodelessMacros_h
#define FBSDKCodelessMacros_h

//  keys for event binding path compoenent
#define CODELESS_MAPPING_METHOD_KEY             @"method"
#define CODELESS_MAPPING_EVENT_NAME_KEY         @"event_name"
#define CODELESS_MAPPING_EVENT_TYPE_KEY         @"event_type"
#define CODELESS_MAPPING_APP_VERSION_KEY        @"app_version"
#define CODELESS_MAPPING_PATH_KEY               @"path"
#define CODELESS_MAPPING_PATH_TYPE_KEY          @"path_type"
#define CODELESS_MAPPING_CLASS_NAME_KEY         @"class_name"
#define CODELESS_MAPPING_MATCH_BITMASK_KEY      @"match_bitmask"
#define CODELESS_MAPPING_ID_KEY                 @"id"
#define CODELESS_MAPPING_INDEX_KEY              @"index"
#define CODELESS_MAPPING_SECTION_KEY            @"section"
#define CODELESS_MAPPING_ROW_KEY                @"row"
#define CODELESS_MAPPING_TEXT_KEY               @"text"
#define CODELESS_MAPPING_TAG_KEY                @"tag"
#define CODELESS_MAPPING_DESC_KEY               @"description"
#define CODELESS_MAPPING_HINT_KEY               @"hint"
#define CODELESS_MAPPING_PARAMETERS_KEY         @"parameters"
#define CODELESS_MAPPING_PARAMETER_NAME_KEY     @"name"
#define CODELESS_MAPPING_PARAMETER_VALUE_KEY    @"value"

#define CODELESS_MAPPING_PARENT_CLASS_NAME      @".."
#define CODELESS_MAPPING_CURRENT_CLASS_NAME     @"."

#define ReactNativeClassRCTView       "RCTView"
#define ReactNativeClassRCTRootView   "RCTRootView"

#define CODELESS_INDEXING_UPLOAD_INTERVAL_IN_SECONDS  1
#define CODELESS_INDEXING_STATUS_KEY            @"is_app_indexing_enabled"
#define CODELESS_INDEXING_SESSION_ID_KEY        @"device_session_id"
#define CODELESS_INDEXING_APP_VERSION_KEY       @"app_version"
#define CODELESS_INDEXING_SDK_VERSION_KEY       @"sdk_version"
#define CODELESS_INDEXING_PLATFORM_KEY          @"platform"
#define CODELESS_INDEXING_TREE_KEY              @"tree"
#define CODELESS_INDEXING_SCREENSHOT_KEY        @"screenshot"
#define CODELESS_INDEXING_EXT_INFO_KEY          @"extinfo"

#define CODELESS_INDEXING_ENDPOINT              @"app_indexing"
#define CODELESS_INDEXING_SESSION_ENDPOINT      @"app_indexing_session"

//  keys for view tree
#define CODELESS_VIEW_TREE_CLASS_NAME_KEY       @"classname"
#define CODELESS_VIEW_TREE_CLASS_TYPE_BIT_MASK_KEY  @"classtypebitmask"
#define CODELESS_VIEW_TREE_TEXT_KEY             @"text"
#define CODELESS_VIEW_TREE_DESC_KEY             @"description"
#define CODELESS_VIEW_TREE_DIMENSION_KEY        @"dimension"
#define CODELESS_VIEW_TREE_TAG_KEY              @"tag"
#define CODELESS_VIEW_TREE_CHILDREN_KEY         @"childviews"
#define CODELESS_VIEW_TREE_HINT_KEY             @"hint"
#define CODELESS_VIEW_TREE_ACTIONS_KEY          @"actions"

#define CODELESS_VIEW_TREE_TOP_KEY              @"top"
#define CODELESS_VIEW_TREE_LEFT_KEY             @"left"
#define CODELESS_VIEW_TREE_WIDTH_KEY            @"width"
#define CODELESS_VIEW_TREE_HEIGHT_KEY           @"height"
#define CODELESS_VIEW_TREE_OFFSET_X_KEY         @"scrollx"
#define CODELESS_VIEW_TREE_OFFSET_Y_KEY         @"scrolly"
#define CODELESS_VIEW_TREE_VISIBILITY_KEY       @"visibility"

#define CODELESS_VIEW_TREE_TEXT_STYLE_KEY       @"text_style"
#define CODELESS_VIEW_TREE_TEXT_IS_BOLD_KEY     @"is_bold"
#define CODELESS_VIEW_TREE_TEXT_IS_ITALIC_KEY   @"is_italic"
#define CODELESS_VIEW_TREE_TEXT_SIZE_KEY        @"font_size"

#endif /* FBSDKCodelessMacros_h */
