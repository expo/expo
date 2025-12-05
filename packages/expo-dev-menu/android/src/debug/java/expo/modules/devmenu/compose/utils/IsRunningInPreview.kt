package expo.modules.devmenu.compose.utils

import android.os.Build

internal val IsRunningInPreview = Build.DEVICE == "layoutlib"
