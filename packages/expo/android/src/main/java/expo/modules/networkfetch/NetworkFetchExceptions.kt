// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkfetch

import expo.modules.kotlin.exception.CodedException

internal class NetworkFetchUnknownException :
  CodedException("Unknown error")

internal class NetworkFetchRequestCancelledException :
  CodedException("Cancelled request")
