package abi46_0_0.expo.modules.webbrowser

import abi46_0_0.expo.modules.kotlin.records.Field
import abi46_0_0.expo.modules.kotlin.records.Record

internal data class OpenBrowserOptions(
  @Field var toolbarColor: String? = null,
  @Field var secondaryToolbarColor: String? = null,
  @Field var browserPackage: String? = null,
  @Field var showTitle: Boolean = false,
  @Field var enableDefaultShareMenuItem: Boolean = false,
  @Field var enableBarCollapsing: Boolean = false,
  @Field var showInRecents: Boolean = false,
  @Field(key = "createTask") var shouldCreateTask: Boolean = true,
) : Record
