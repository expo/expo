// Copyright 2018-present 650 Industries. All rights reserved.

package expo.modules.adapters.react

import com.facebook.jni.HybridData
import com.facebook.soloader.SoLoader
import expo.modules.core.interfaces.DoNotStrip
import expo.modules.kotlin.jni.ExpectedType
import expo.modules.kotlin.views.ViewManagerWrapperDelegate

@Suppress("KotlinJniMissingFunction")
@DoNotStrip
class FabricComponentsRegistry(viewDelegates: List<ViewManagerWrapperDelegate>) {
  @DoNotStrip
  private val mHybridData = initHybrid()

  init {
    val componentNames = Array(viewDelegates.size) { i ->
      viewDelegates[i].viewManagerName
    }

    val stateProps = viewDelegates.map {
      it.props.filter { (_, prop) -> prop.isStateProp }.values
    }

    val statePropNames = Array(componentNames.size) { i ->
      Array(stateProps[i].size) { j ->
        stateProps[i].elementAt(j).name
      }
    }

    val statePropsType = Array(componentNames.size) { i ->
      Array(stateProps[i].size) { j ->
        stateProps[i].elementAt(j).type.getCppRequiredTypes()
      }
    }

    registerComponentsRegistry(
      componentNames,
      statePropNames,
      statePropsType
    )
  }

  private external fun initHybrid(): HybridData
  private external fun registerComponentsRegistry(
    componentNames: Array<String>,
    statePropNames: Array<Array<String>>,
    statePropTypes: Array<Array<ExpectedType>>
  )

  @Throws(Throwable::class)
  protected fun finalize() {
    mHybridData.resetNative()
  }

  companion object {
    init {
      SoLoader.loadLibrary("expo-modules-core")
    }
  }
}
