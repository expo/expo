package expo.modules.widgets

import android.content.ComponentName
import android.content.Context

private const val PROVIDER_SUFFIX = "Provider"

internal fun widgetProviderComponentName(context: Context, widgetName: String): ComponentName {
  return ComponentName(context.packageName, "${context.packageName}.$widgetName$PROVIDER_SUFFIX")
}
