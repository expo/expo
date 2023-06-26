/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

/* These macros are used to stub C functions. Here's an example:
 *
 * Helpers.h
 * ------
 * boolean ReturnsTrueOrFalse(void);
 *
 * FileToBeTested.h
 * ------
 * ABI49_0_0RCT_MOCK_DEF(Testing, ReturnsTrueOrFalse);
 * #define ReturnsTrueOrFalse ABI49_0_0RCT_MOCK_USE(Testing, ReturnsTrueOrFalse)
 *
 * int FunctionToBeTested(int input) {
 *   return ReturnsTrueOrFalse() ? input + 1 : input - 1;
 * }
 *
 * Test.h
 * -----
 * ABI49_0_0RCT_MOCK_GET(Testing, ReturnsTrueOrFalse);
 *
 * boolean _ReturnsTrue(void) { return true; }
 * boolean _ReturnsFalse(void) { return false; }
 *
 * void TestFunctionTrue(void) {
 *   ABI49_0_0RCT_MOCK_SET(Testing, ReturnsTrueOrFalse, _ReturnsTrue);
 *   assert(FunctionToBeTested(5) == 6);
 *   ABI49_0_0RCT_MOCK_RESET(Testing, ReturnsTrueOrFalse);
 * }
 *
 * void TestFunctionFalse(void) {
 *   ABI49_0_0RCT_MOCK_SET(Testing, ReturnsTrueOrFalse, _ReturnsFalse);
 *   assert(FunctionToBeTested(5) == 4);
 *   ABI49_0_0RCT_MOCK_RESET(Testing, ReturnsTrueOrFalse);
 * }
 *
 */

#ifdef ABI49_0_0RCT_DEV
#define ABI49_0_0RCT_MOCK_DEF(context, api) \
  __typeof(__typeof(api) *) mockptr_##context##_##api = &api;
#define ABI49_0_0RCT_MOCK_REF(context, api) \
  extern __typeof(__typeof(api) *) mockptr_##context##_##api;
#define ABI49_0_0RCT_MOCK_SET(context, api, mockapi) \
  (mockptr_##context##_##api = &mockapi)
#define ABI49_0_0RCT_MOCK_RESET(context, api) (mockptr_##context##_##api = &api)
#define ABI49_0_0RCT_MOCK_USE(context, api) (*mockptr_##context##_##api)
#else
#define ABI49_0_0RCT_MOCK_DEF(context, api)
#define ABI49_0_0RCT_MOCK_REF(context, api)
#define ABI49_0_0RCT_MOCK_SET(context, api, mockapi)
#define ABI49_0_0RCT_MOCK_RESET(context, api)
#define ABI49_0_0RCT_MOCK_USE(context, api) api
#endif
