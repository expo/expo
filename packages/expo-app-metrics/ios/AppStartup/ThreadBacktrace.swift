// Copyright 2025-present 650 Industries. All rights reserved.

import Darwin
import Foundation

/// Captures the call stack of another thread: suspends it, reads its registers and walks the
/// frame-pointer chain. Returns raw return addresses, innermost first.
///
/// Nothing may allocate while the target is suspended — if it was holding the malloc lock, an
/// allocation here would deadlock the process — so the caller preallocates the output buffer and
/// everything between `thread_suspend` and `thread_resume` works on stack locals.
enum ThreadBacktrace {
  static let maxFrames = 128

  /// Writes up to `capacity` return addresses into `buffer` and returns how many were written.
  /// Returns `0` when the thread couldn't be suspended or its registers couldn't be read.
  static func capture(thread: thread_t, into buffer: UnsafeMutablePointer<UInt64>, capacity: Int) -> Int {
    guard capacity > 0, thread_suspend(thread) == KERN_SUCCESS else {
      return 0
    }
    defer {
      thread_resume(thread)
    }
    var pc: UInt64 = 0
    var lr: UInt64 = 0
    var fp: UInt64 = 0
    guard readRegisters(thread: thread, pc: &pc, lr: &lr, fp: &fp) else {
      return 0
    }
    var count = 0
    buffer[count] = pc
    count += 1
    // On arm64 a leaf function may not have pushed its return address yet; the link register holds
    // it. When the frame chain later yields the same address it's dropped as a duplicate.
    if lr != 0, count < capacity {
      buffer[count] = lr
      count += 1
    }
    var frame = fp
    while frame != 0, count < capacity {
      var next: UInt64 = 0
      var returnAddress: UInt64 = 0
      guard readWord(at: frame, into: &next), readWord(at: frame &+ 8, into: &returnAddress) else {
        break
      }
      if returnAddress == 0 {
        break
      }
      if returnAddress != buffer[count - 1] {
        buffer[count] = returnAddress
        count += 1
      }
      // Stacks grow down, so a well-formed chain only ever moves up.
      guard next > frame else {
        break
      }
      frame = next
    }
    return count
  }

  private static func readRegisters(thread: thread_t, pc: inout UInt64, lr: inout UInt64, fp: inout UInt64) -> Bool {
    #if arch(arm64)
    var state = arm_thread_state64_t()
    var count = mach_msg_type_number_t(MemoryLayout<arm_thread_state64_t>.size / MemoryLayout<natural_t>.size)
    let result = withUnsafeMutablePointer(to: &state) { statePtr in
      statePtr.withMemoryRebound(to: natural_t.self, capacity: Int(count)) { rebound in
        thread_get_state(thread, thread_state_flavor_t(ARM_THREAD_STATE64), rebound, &count)
      }
    }
    guard result == KERN_SUCCESS else {
      return false
    }
    pc = state.__pc
    lr = state.__lr
    fp = state.__fp
    return true
    #elseif arch(x86_64)
    var state = x86_thread_state64_t()
    var count = mach_msg_type_number_t(MemoryLayout<x86_thread_state64_t>.size / MemoryLayout<natural_t>.size)
    let result = withUnsafeMutablePointer(to: &state) { statePtr in
      statePtr.withMemoryRebound(to: natural_t.self, capacity: Int(count)) { rebound in
        thread_get_state(thread, thread_state_flavor_t(x86_THREAD_STATE64), rebound, &count)
      }
    }
    guard result == KERN_SUCCESS else {
      return false
    }
    pc = state.__rip
    lr = 0
    fp = state.__rbp
    return true
    #else
    return false
    #endif
  }

  /// Reads one 8-byte word through the kernel so an unmapped or misaligned frame pointer fails
  /// instead of faulting.
  private static func readWord(at address: UInt64, into value: inout UInt64) -> Bool {
    guard address % 8 == 0, address <= UInt64(UInt.max) else {
      return false
    }
    var outSize: vm_size_t = 0
    let result = withUnsafeMutablePointer(to: &value) { valuePtr in
      vm_read_overwrite(
        mach_task_self_,
        vm_address_t(address),
        vm_size_t(MemoryLayout<UInt64>.size),
        vm_address_t(UInt(bitPattern: valuePtr)),
        &outSize
      )
    }
    return result == KERN_SUCCESS && outSize == vm_size_t(MemoryLayout<UInt64>.size)
  }
}
