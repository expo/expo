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

internal class FetchBlobModuleUnavailableException :
  CodedException(
    "Unable to store the response body as a blob because React Native's BlobModule is not available. " +
      "Make sure your app includes the React Native blob support or read the body with arrayBuffer() instead"
  )
