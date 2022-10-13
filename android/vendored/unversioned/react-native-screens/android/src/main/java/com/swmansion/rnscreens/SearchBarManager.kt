package com.swmansion.rnscreens

import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

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

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.builder<String, Any>()
            .put("onChangeText", MapBuilder.of("registrationName", "onChangeText"))
            .put("onSearchButtonPress", MapBuilder.of("registrationName", "onSearchButtonPress"))
            .put("onFocus", MapBuilder.of("registrationName", "onFocus"))
            .put("onBlur", MapBuilder.of("registrationName", "onBlur"))
            .put("onClose", MapBuilder.of("registrationName", "onClose"))
            .put("onOpen", MapBuilder.of("registrationName", "onOpen"))
            .build()
    }

    companion object {
        const val REACT_CLASS = "RNSSearchBar"
    }
}
