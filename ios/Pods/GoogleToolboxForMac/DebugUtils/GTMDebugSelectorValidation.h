//
//  GTMDebugSelectorValidation.h
//
//  This file should only be included within an implimation file.  In any
//  function that takes an object and selector to invoke, you should call:
//
//    GTMAssertSelectorNilOrImplementedWithArguments(obj, sel, @encode(arg1type), ..., NULL)
//  or
//    GTMAssertSelectorNilOrImplementedWithReturnTypeAndArguments(obj, sel, @encode(returnType), @encode(arg1type), ..., NULL)
//
//  This will then validate that the selector is defined and using the right
//  type(s), this can help catch errors much earlier then waiting for the
//  selector to actually fire (and in the case of error selectors, might never
//  really be tested until in the field).
//
//  Copyright 2007-2008 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

#if DEBUG

#import <stdarg.h>
#import "GTMDefines.h"

static void GTMAssertSelectorNilOrImplementedWithReturnTypeAndArguments(id obj, SEL sel, const char *retType, ...) {

  // verify that the object's selector is implemented with the proper
  // number and type of arguments
  va_list argList;
  va_start(argList, retType);

  if (obj && sel) {
    // check that the selector is implemented
    _GTMDevAssert([obj respondsToSelector:sel],
                  @"\"%@\" selector \"%@\" is unimplemented or misnamed",
                  NSStringFromClass([obj class]),
                  NSStringFromSelector(sel));

    const char *expectedArgType;
    NSUInteger argCount = 2; // skip self and _cmd
    NSMethodSignature *sig = [obj methodSignatureForSelector:sel];

    // check that each expected argument is present and of the correct type
    while ((expectedArgType = va_arg(argList, const char*)) != 0) {

      if ([sig numberOfArguments] > argCount) {
        const char *foundArgType = [sig getArgumentTypeAtIndex:argCount];

        _GTMDevAssert(0 == strncmp(foundArgType, expectedArgType, strlen(expectedArgType)),
                      @"\"%@\" selector \"%@\" argument %u should be type %s",
                      NSStringFromClass([obj class]),
                      NSStringFromSelector(sel),
                      (uint32_t)(argCount - 2),
                      expectedArgType);
      }
      argCount++;
    }

    // check that the proper number of arguments are present in the selector
    _GTMDevAssert(argCount == [sig numberOfArguments],
                  @"\"%@\" selector \"%@\" should have %u arguments",
                  NSStringFromClass([obj class]),
                  NSStringFromSelector(sel),
                  (uint32_t)(argCount - 2));

    // if asked, validate the return type
    if (retType && (strcmp("gtm_skip_return_test", retType) != 0)) {
      const char *foundRetType = [sig methodReturnType];
      _GTMDevAssert(0 == strncmp(foundRetType, retType, strlen(retType)),
                    @"\"%@\" selector \"%@\" return type should be type %s",
                    NSStringFromClass([obj class]),
                    NSStringFromSelector(sel),
                    retType);
    }
  }

  va_end(argList);
}

#define GTMAssertSelectorNilOrImplementedWithArguments(obj, sel, ...) \
  GTMAssertSelectorNilOrImplementedWithReturnTypeAndArguments((obj), (sel), "gtm_skip_return_test", __VA_ARGS__)

#else // DEBUG

// make it go away if not debug
#define GTMAssertSelectorNilOrImplementedWithReturnTypeAndArguments(obj, sel, retType, ...) do { } while (0)
#define GTMAssertSelectorNilOrImplementedWithArguments(obj, sel, ...) do { } while (0)

#endif // DEBUG
