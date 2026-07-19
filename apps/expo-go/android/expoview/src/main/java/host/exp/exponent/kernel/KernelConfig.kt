// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

object KernelConfig {
  @JvmStatic var IS_TEST = false

  // Used for testing. Don't want the "Fetching JS Bundle" screen to pop up.
  var FORCE_NO_KERNEL_DEBUG_MODE = false

  // Used for testing.
  var FORCE_UNVERSIONED_PUBLISHED_EXPERIENCES = false

  // Used for testing.
  var HIDE_ONBOARDING = false
}
