// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.exception.CodedException

internal class FetchUnknownException :
  CodedException("Unknown error")

internal class FetchRequestCanceledException :
  CodedException("Fetch request has been canceled")

internal class FetchAndroidContextLostException :
  CodedException("The Android context has been lost")

internal class FetchRedirectException :
  CodedException("Redirect is not allowed when redirect mode is 'error'")
