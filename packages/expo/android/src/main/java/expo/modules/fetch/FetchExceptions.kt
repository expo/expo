// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.exception.CodedException

internal class FetchUnknownException :
  CodedException("Unknown error")

internal class FetchRequestCancelledException :
  CodedException("Cancelled request")

internal class FetchAndroidContextLostException :
  CodedException("The Android context has been lost")
