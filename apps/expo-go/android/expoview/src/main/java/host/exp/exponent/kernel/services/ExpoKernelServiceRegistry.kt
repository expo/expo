// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services

import android.content.Context
import host.exp.exponent.kernel.services.linking.LinkingKernelService
import host.exp.exponent.storage.ExponentSharedPreferences

class ExpoKernelServiceRegistry(
  context: Context,
  exponentSharedPreferences: ExponentSharedPreferences
) {
  val linkingKernelService = LinkingKernelService()
  val permissionsKernelService = PermissionsKernelService(context, exponentSharedPreferences)
}
