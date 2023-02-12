package com.swmansion.rnscreens

import android.annotation.SuppressLint
import android.text.InputType
import androidx.appcompat.widget.SearchView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.views.view.ReactViewGroup

@SuppressLint("ViewConstructor")
class SearchBarView(reactContext: ReactContext?) : ReactViewGroup(reactContext) {
    var inputType: SearchBarInputTypes = SearchBarInputTypes.TEXT
    var autoCapitalize: SearchBarAutoCapitalize = SearchBarAutoCapitalize.NONE
    var textColor: Int? = null
    var tintColor: Int? = null
    var headerIconColor: Int? = null
    var hintTextColor: Int? = null
    var placeholder: String = ""
    var shouldOverrideBackButton: Boolean = true
    var autoFocus: Boolean = false
    var shouldShowHintSearchIcon: Boolean = true

    private var mSearchViewFormatter: SearchViewFormatter? = null

    private var mAreListenersSet: Boolean = false

    private val screenStackFragment: ScreenStackFragment?
        get() {
            val currentParent = parent
            if (currentParent is ScreenStackHeaderSubview) {
                return currentParent.config?.screenFragment
            }
            return null
        }

    fun onUpdate() {
        setSearchViewProps()
    }

    private fun setSearchViewProps() {
        val searchView = screenStackFragment?.searchView
        if (searchView != null) {
            if (!mAreListenersSet) {
                setSearchViewListeners(searchView)
                mAreListenersSet = true
            }

            searchView.inputType = inputType.toAndroidInputType(autoCapitalize)
            mSearchViewFormatter?.setTextColor(textColor)
            mSearchViewFormatter?.setTintColor(tintColor)
            mSearchViewFormatter?.setHeaderIconColor(headerIconColor)
            mSearchViewFormatter?.setHintTextColor(hintTextColor)
            mSearchViewFormatter?.setPlaceholder(placeholder, shouldShowHintSearchIcon)
            searchView.overrideBackAction = shouldOverrideBackButton
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        screenStackFragment?.onSearchViewCreate = { newSearchView ->
            if (mSearchViewFormatter == null) mSearchViewFormatter =
                SearchViewFormatter(newSearchView)
            setSearchViewProps()
            if (autoFocus) {
                screenStackFragment?.searchView?.focus()
            }
        }
    }

    private fun setSearchViewListeners(searchView: SearchView) {
        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextChange(newText: String?): Boolean {
                handleTextChange(newText)
                return true
            }

            override fun onQueryTextSubmit(query: String?): Boolean {
                handleTextSubmit(query)
                return true
            }
        })
        searchView.setOnQueryTextFocusChangeListener { _, hasFocus ->
            handleFocusChange(hasFocus)
        }
        searchView.setOnCloseListener {
            handleClose()
            false
        }
        searchView.setOnSearchClickListener {
            handleOpen()
        }
    }

    private fun handleTextChange(newText: String?) {
        val event = Arguments.createMap()
        event.putString("text", newText)
        sendEvent("onChangeText", event)
    }

    private fun handleFocusChange(hasFocus: Boolean) {
        sendEvent(if (hasFocus) "onFocus" else "onBlur", null)
    }

    private fun handleClose() {
        sendEvent("onClose", null)
    }

    private fun handleOpen() {
        sendEvent("onOpen", null)
    }

    private fun handleTextSubmit(newText: String?) {
        val event = Arguments.createMap()
        event.putString("text", newText)
        sendEvent("onSearchButtonPress", event)
    }

    private fun sendEvent(eventName: String, eventContent: WritableMap?) {
        (context as ReactContext).getJSModule(RCTEventEmitter::class.java)
            ?.receiveEvent(id, eventName, eventContent)
    }

    enum class SearchBarAutoCapitalize {
        NONE, WORDS, SENTENCES, CHARACTERS
    }

    enum class SearchBarInputTypes {
        TEXT {
            override fun toAndroidInputType(capitalize: SearchBarAutoCapitalize) =
                when (capitalize) {
                    SearchBarAutoCapitalize.NONE -> InputType.TYPE_CLASS_TEXT
                    SearchBarAutoCapitalize.WORDS -> InputType.TYPE_TEXT_FLAG_CAP_WORDS
                    SearchBarAutoCapitalize.SENTENCES -> InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
                    SearchBarAutoCapitalize.CHARACTERS -> InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
                }
        },
        PHONE {
            override fun toAndroidInputType(capitalize: SearchBarAutoCapitalize) =
                InputType.TYPE_CLASS_PHONE
        },
        NUMBER {
            override fun toAndroidInputType(capitalize: SearchBarAutoCapitalize) =
                InputType.TYPE_CLASS_NUMBER
        },
        EMAIL {
            override fun toAndroidInputType(capitalize: SearchBarAutoCapitalize) =
                InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        };

        abstract fun toAndroidInputType(capitalize: SearchBarAutoCapitalize): Int
    }
}
