package expo.interfaces.devmenu.items

import android.os.Bundle

interface DevMenuDataSourceItem {
  fun serialize(): Bundle
}

interface DevMenuDataSourceInterface {
  val id: String

  suspend fun fetchData(): List<DevMenuDataSourceItem>
}

class DevMenuListDataSource(
  override val id: String,
  val dataFetcher: suspend () -> List<DevMenuSelectionList.Item>
) : DevMenuDataSourceInterface {
  override suspend fun fetchData(): List<DevMenuDataSourceItem> {
    return dataFetcher()
  }
}
