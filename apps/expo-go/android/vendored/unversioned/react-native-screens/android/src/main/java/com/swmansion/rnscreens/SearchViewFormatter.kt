package com.swmansion.rnscreens

import android.graphics.drawable.Drawable
import android.view.View
import android.widget.EditText
import android.widget.ImageView
import androidx.appcompat.R
import androidx.appcompat.widget.SearchView

class SearchViewFormatter(var searchView: SearchView) {
    private var mDefaultTextColor: Int? = null
    private var mDefaultTintBackground: Drawable? = null

    private val searchEditText
        get() = searchView.findViewById<View>(R.id.search_src_text) as? EditText
    private val searchTextPlate
        get() = searchView.findViewById<View>(R.id.search_plate)
    private val searchIcon
        get() = searchView.findViewById<ImageView>(R.id.search_button)
    private val searchCloseIcon
        get() = searchView.findViewById<ImageView>(R.id.search_close_btn)

    fun setTextColor(textColor: Int?) {
        val currentDefaultTextColor = mDefaultTextColor
        if (textColor != null) {
            if (mDefaultTextColor == null) {
                mDefaultTextColor = searchEditText?.textColors?.defaultColor
            }
            searchEditText?.setTextColor(textColor)
        } else if (currentDefaultTextColor != null) {
            searchEditText?.setTextColor(currentDefaultTextColor)
        }
    }

    fun setTintColor(tintColor: Int?) {
        val currentDefaultTintColor = mDefaultTintBackground
        if (tintColor != null) {
            if (mDefaultTintBackground == null) {
                mDefaultTintBackground = searchTextPlate.background
            }
            searchTextPlate.setBackgroundColor(tintColor)
        } else if (currentDefaultTintColor != null) {
            searchTextPlate.background = currentDefaultTintColor
        }
    }

    fun setHeaderIconColor(headerIconColor: Int?) {
        headerIconColor?.let {
            searchIcon.setColorFilter(it)
            searchCloseIcon.setColorFilter(it)
        }
    }

    fun setHintTextColor(hintTextColor: Int?) {
        hintTextColor?.let {
            searchEditText?.setHintTextColor(it)
        }
    }

    fun setPlaceholder(placeholder: String, shouldShowHintSearchIcon: Boolean) {
        if (shouldShowHintSearchIcon) {
            searchView.queryHint = placeholder
        } else {
            searchEditText?.hint = placeholder
        }
    }
}
