/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI28_0_0RCTDefines.h"
#include "ABI28_0_0RCTMacros.h"

#if ABI28_0_0RCT_PROFILE && defined(__i386__)

  .globl SYMBOL_NAME(ABI28_0_0RCTProfileTrampoline)
SYMBOL_NAME(ABI28_0_0RCTProfileTrampoline):
  /**
   * The x86 version is much simpler, since all the arguments are passed in the
   * stack, so we just have to preserve the stack pointer (%esp) and the callee
   * saved register used to keep the memory allocated
   *
   * The explanation here is also shorter, refer to the x86_64 implementation to
   * a richer explanation
   */

  /**
   * Allocate memory to save the caller of ABI28_0_0RCTProfileTrampoline (used afterwards
   * to return at the end of the function) and the initial value for the callee
   * saved register (%edi) that will be used to point to the memory allocated.
   */
  subl $0x8, %esp // stack padding (16-byte alignment for function calls)
  pushl $0xc // allocate 12-bytes
  calll SYMBOL_NAME(ABI28_0_0RCTProfileMalloc)
  addl $0xc, %esp // restore stack (8-byte padding + 4-byte argument)

  /**
   * actually store the values in the memory allocated
   */
  movl %edi, 0x0(%eax) // previous value of edi
  popl 0x4(%eax) // caller of ABI28_0_0RCTProfileTrampoline

  // save the pointer to the allocated memory in %edi
  movl %eax, %edi

  /**
   * void ABI28_0_0RCTProfileGetImplementation(id object, SEL selector) in ABI28_0_0RCTProfile.m
   *
   * Get the address of the actual C function we have to profile
   */
  calll SYMBOL_NAME(ABI28_0_0RCTProfileGetImplementation)
  movl %eax, 0x8(%edi) // Save it in the allocated memory

  /**
   * void ABI28_0_0RCTProfileTrampolineStart(id, SEL) in ABI28_0_0RCTProfile.m
   *
   * start profile - the arguments are already in the right position in the
   * stack since it takes the same first 2 arguments as the any ObjC function -
   * "self" and "_cmd"
   */
  calll SYMBOL_NAME(ABI28_0_0RCTProfileTrampolineStart)

  /**
   * Call the actual function and save it's return value, since it should be the
   * return value of ABI28_0_0RCTProfileTrampoline
   */
  calll *0x8(%edi)
  pushl %eax

  // Align stack and end profile
  subl $0xc, %esp
  calll SYMBOL_NAME(ABI28_0_0RCTProfileTrampolineEnd)
  addl $0xc, %esp // restore the stack

  /**
   * Move the values from the allocated memory to the stack, restore the
   * value of %edi, and prepare to free the allocated memory.
   */
  pushl 0x4(%edi) // caller of ABI28_0_0RCTProfileTrampoline
  subl $0x4, %esp // Stack padding
  pushl %edi // push the memory address
  movl 0x0(%edi), %edi // restore the value of %edi

  /**
   * Actually free the memory used to store the values across function calls,
   * the stack has already been padded and the first and only argument, the
   * memory address, is already in the bottom of the stack.
   */
  calll SYMBOL_NAME(ABI28_0_0RCTProfileFree)
  addl $0x8, %esp

  /**
   * pop the caller address to %ecx and the actual function return value to
   * %eax, so it's the return value of ABI28_0_0RCTProfileTrampoline
   */
  popl %ecx
  popl %eax
  jmpl *%ecx

#endif
