package com.swmansion.rnscreens

import android.content.Context
import androidx.appcompat.widget.Toolbar

// This class is used to store config closer to search bar
open class CustomToolbar(context: Context, val config: ScreenStackHeaderConfig) : Toolbar(context)
