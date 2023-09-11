package com.swmansion.rnscreens

import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import com.swmansion.rnscreens.events.SearchBarBlurEvent
import com.swmansion.rnscreens.events.SearchBarChangeTextEvent
import com.swmansion.rnscreens.events.SearchBarCloseEvent
import com.swmansion.rnscreens.events.SearchBarFocusEvent
import com.swmansion.rnscreens.events.SearchBarOpenEvent
import com.swmansion.rnscreens.events.SearchBarSearchButtonPressEvent

@ReactModule(name = SearchBarManager.REACT_CLASS)
class SearchBarManager : ViewGroupManager<SearchBarView>() {
    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(context: ThemedReactContext): SearchBarView {
        return SearchBarView(context)
    }

    override fun onAfterUpdateTransaction(view: SearchBarView) {
        super.onAfterUpdateTransaction(view)
        view.onUpdate()
    }

    @ReactProp(name = "autoCapitalize")
    fun setAutoCapitalize(view: SearchBarView, autoCapitalize: String?) {
        view.autoCapitalize = when (autoCapitalize) {
            null, "none" -> SearchBarView.SearchBarAutoCapitalize.NONE
            "words" -> SearchBarView.SearchBarAutoCapitalize.WORDS
            "sentences" -> SearchBarView.SearchBarAutoCapitalize.SENTENCES
            "characters" -> SearchBarView.SearchBarAutoCapitalize.CHARACTERS
            else -> throw JSApplicationIllegalArgumentException(
                "Forbidden auto capitalize value passed"
            )
        }
    }

    @ReactProp(name = "autoFocus")
    fun setAutoFocus(view: SearchBarView, autoFocus: Boolean?) {
        view.autoFocus = autoFocus ?: false
    }

    @ReactProp(name = "barTintColor", customType = "Color")
    fun setTintColor(view: SearchBarView, color: Int?) {
        view.tintColor = color
    }

    @ReactProp(name = "disableBackButtonOverride")
    fun setDisableBackButtonOverride(view: SearchBarView, disableBackButtonOverride: Boolean?) {
        view.shouldOverrideBackButton = disableBackButtonOverride != true
    }

    @ReactProp(name = "inputType")
    fun setInputType(view: SearchBarView, inputType: String?) {
        view.inputType = when (inputType) {
            null, "text" -> SearchBarView.SearchBarInputTypes.TEXT
            "phone" -> SearchBarView.SearchBarInputTypes.PHONE
            "number" -> SearchBarView.SearchBarInputTypes.NUMBER
            "email" -> SearchBarView.SearchBarInputTypes.EMAIL
            else -> throw JSApplicationIllegalArgumentException(
                "Forbidden input type value"
            )
        }
    }

    @ReactProp(name = "placeholder")
    fun setPlaceholder(view: SearchBarView, placeholder: String?) {
        if (placeholder != null) {
            view.placeholder = placeholder
        }
    }

    @ReactProp(name = "textColor", customType = "Color")
    fun setTextColor(view: SearchBarView, color: Int?) {
        view.textColor = color
    }

    @ReactProp(name = "headerIconColor", customType = "Color")
    fun setHeaderIconColor(view: SearchBarView, color: Int?) {
        view.headerIconColor = color
    }

    @ReactProp(name = "hintTextColor", customType = "Color")
    fun setHintTextColor(view: SearchBarView, color: Int?) {
        view.hintTextColor = color
    }

    @ReactProp(name = "shouldShowHintSearchIcon")
    fun setShouldShowHintSearchIcon(view: SearchBarView, shouldShowHintSearchIcon: Boolean?) {
        view.shouldShowHintSearchIcon = shouldShowHintSearchIcon ?: true
    }

    override fun receiveCommand(root: SearchBarView, commandId: String?, args: ReadableArray?) {
        when (commandId) {
            "focus" -> root.handleFocusJsRequest()
            "blur" -> root.handleBlurJsRequest()
            "clearText" -> root.handleClearTextJsRequest()
            "toggleCancelButton" -> root.handleToggleCancelButtonJsRequest(false) // just a dummy argument
            "setText" -> root.handleSetTextJsRequest(args?.getString(0))
            else -> throw JSApplicationIllegalArgumentException("Unsupported native command received: $commandId")
        }
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.of(
            SearchBarBlurEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onBlur"),
            SearchBarChangeTextEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onChangeText"),
            SearchBarCloseEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onClose"),
            SearchBarFocusEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onFocus"),
            SearchBarOpenEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onOpen"),
            SearchBarSearchButtonPressEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onSearchButtonPress"),
        )
    }

    companion object {
        const val REACT_CLASS = "RNSSearchBar"
    }
}
