/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * GULOriginalIMPConvenienceMacros.h
 *
 * This header contains convenience macros for invoking the original IMP of a swizzled method.
 */

/**
 *  Invokes original IMP when the original selector takes no arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 */
#define GUL_INVOKE_ORIGINAL_IMP0(__receivingObject, __swizzledSEL, __returnType, __originalIMP) \
  ((__returnType(*)(id, SEL))__originalIMP)(__receivingObject, __swizzledSEL)

/**
 *  Invokes original IMP when the original selector takes 1 argument.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP1(__receivingObject, __swizzledSEL, __returnType, __originalIMP,   \
                                 __arg1)                                                          \
  ((__returnType(*)(id, SEL, __typeof__(__arg1)))__originalIMP)(__receivingObject, __swizzledSEL, \
                                                                __arg1)

/**
 *  Invokes original IMP when the original selector takes 2 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP2(__receivingObject, __swizzledSEL, __returnType, __originalIMP, \
                                 __arg1, __arg2)                                                \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2)))__originalIMP)(            \
      __receivingObject, __swizzledSEL, __arg1, __arg2)

/**
 *  Invokes original IMP when the original selector takes 3 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP3(__receivingObject, __swizzledSEL, __returnType, __originalIMP,  \
                                 __arg1, __arg2, __arg3)                                         \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2),                             \
                    __typeof__(__arg3)))__originalIMP)(__receivingObject, __swizzledSEL, __arg1, \
                                                       __arg2, __arg3)

/**
 *  Invokes original IMP when the original selector takes 4 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP4(__receivingObject, __swizzledSEL, __returnType, __originalIMP,  \
                                 __arg1, __arg2, __arg3, __arg4)                                 \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),         \
                    __typeof__(__arg4)))__originalIMP)(__receivingObject, __swizzledSEL, __arg1, \
                                                       __arg2, __arg3, __arg4)

/**
 *  Invokes original IMP when the original selector takes 5 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 *  @param __arg5 The fifth argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP5(__receivingObject, __swizzledSEL, __returnType, __originalIMP, \
                                 __arg1, __arg2, __arg3, __arg4, __arg5)                        \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),        \
                    __typeof__(__arg4), __typeof__(__arg5)))__originalIMP)(                     \
      __receivingObject, __swizzledSEL, __arg1, __arg2, __arg3, __arg4, __arg5)

/**
 *  Invokes original IMP when the original selector takes 6 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 *  @param __arg5 The fifth argument.
 *  @param __arg6 The sixth argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP6(__receivingObject, __swizzledSEL, __returnType, __originalIMP, \
                                 __arg1, __arg2, __arg3, __arg4, __arg5, __arg6)                \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),        \
                    __typeof__(__arg4), __typeof__(__arg5), __typeof__(__arg6)))__originalIMP)( \
      __receivingObject, __swizzledSEL, __arg1, __arg2, __arg3, __arg4, __arg5, __arg6)

/**
 *  Invokes original IMP when the original selector takes 7 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 *  @param __arg5 The fifth argument.
 *  @param __arg6 The sixth argument.
 *  @param __arg7 The seventh argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP7(__receivingObject, __swizzledSEL, __returnType, __originalIMP, \
                                 __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7)        \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),        \
                    __typeof__(__arg4), __typeof__(__arg5), __typeof__(__arg6),                 \
                    __typeof__(__arg7)))__originalIMP)(                                         \
      __receivingObject, __swizzledSEL, __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7)

/**
 *  Invokes original IMP when the original selector takes 8 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 *  @param __arg5 The fifth argument.
 *  @param __arg6 The sixth argument.
 *  @param __arg7 The seventh argument.
 *  @param __arg8 The eighth argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP8(__receivingObject, __swizzledSEL, __returnType, __originalIMP,  \
                                 __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7, __arg8) \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),         \
                    __typeof__(__arg4), __typeof__(__arg5), __typeof__(__arg6),                  \
                    __typeof__(__arg7), __typeof__(__arg8)))__originalIMP)(                      \
      __receivingObject, __swizzledSEL, __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7,  \
      __arg8)

/**
 *  Invokes original IMP when the original selector takes 9 arguments.
 *
 *  @param __receivingObject The object on which the IMP is invoked.
 *  @param __swizzledSEL The selector used for swizzling.
 *  @param __returnType  The return type of the original implementation.
 *  @param __originalIMP The original IMP.
 *  @param __arg1 The first argument.
 *  @param __arg2 The second argument.
 *  @param __arg3 The third argument.
 *  @param __arg4 The fourth argument.
 *  @param __arg5 The fifth argument.
 *  @param __arg6 The sixth argument.
 *  @param __arg7 The seventh argument.
 *  @param __arg8 The eighth argument.
 *  @param __arg9 The ninth argument.
 */
#define GUL_INVOKE_ORIGINAL_IMP9(__receivingObject, __swizzledSEL, __returnType, __originalIMP,  \
                                 __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7, __arg8, \
                                 __arg9)                                                         \
  ((__returnType(*)(id, SEL, __typeof__(__arg1), __typeof__(__arg2), __typeof__(__arg3),         \
                    __typeof__(__arg4), __typeof__(__arg5), __typeof__(__arg6),                  \
                    __typeof__(__arg7), __typeof__(__arg8), __typeof__(__arg9)))__originalIMP)(  \
      __receivingObject, __swizzledSEL, __arg1, __arg2, __arg3, __arg4, __arg5, __arg6, __arg7,  \
      __arg8, __arg9)
