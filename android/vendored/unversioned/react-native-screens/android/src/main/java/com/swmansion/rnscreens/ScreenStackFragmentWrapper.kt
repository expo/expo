package com.swmansion.rnscreens

import androidx.appcompat.widget.Toolbar

interface ScreenStackFragmentWrapper : ScreenFragmentWrapper {
    // Toolbar management
    fun removeToolbar()
    fun setToolbar(toolbar: Toolbar)
    fun setToolbarShadowHidden(hidden: Boolean)
    fun setToolbarTranslucent(translucent: Boolean)

    // Navigation
    fun canNavigateBack(): Boolean
    fun dismiss()
}
