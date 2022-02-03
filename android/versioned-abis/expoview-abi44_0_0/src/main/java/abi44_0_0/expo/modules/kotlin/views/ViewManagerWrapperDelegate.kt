package abi44_0_0.expo.modules.kotlin.views

import android.content.Context
import android.view.View
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.expo.modules.kotlin.ModuleHolder

class ViewManagerWrapperDelegate(internal var moduleHolder: ModuleHolder) {
  private val definition: ViewManagerDefinition
    get() = requireNotNull(moduleHolder.definition.viewManagerDefinition)

  val name: String
    get() = moduleHolder.name

  fun createView(context: Context): View =
    definition.createView(context)

  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    definition.setProps(proxiedProperties, view)
  }
}
