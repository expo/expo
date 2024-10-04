package versioned.host.exp.exponent.modules.api.screens

import android.graphics.drawable.Drawable
import android.view.View
import android.widget.EditText
import androidx.appcompat.widget.SearchView

class SearchViewFormatter(var searchView: SearchView) {
  private var mDefaultTextColor: Int? = null
  private var mDefaultTintBackground: Drawable? = null

  private val searchEditText
    get() = searchView.findViewById<View>(androidx.appcompat.R.id.search_src_text) as? EditText
  private val searchTextPlate
    get() = searchView.findViewById<View>(androidx.appcompat.R.id.search_plate)

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
}
