package expo.modules.network

enum class NetworkStateType(val value: String) {
  NONE("NONE"),
  UNKNOWN("UNKNOWN"),
  CELLULAR("CELLULAR"),
  WIFI("WIFI"),
  BLUETOOTH("BLUETOOTH"),
  ETHERNET("ETHERNET"),
  WIMAX("WIMAX"),
  VPN("VPN"),
  OTHER("OTHER");

  val isDefined: Boolean
    get() = this.value != "NONE" && this.value != "UNKNOWN"
}

enum class NetworkCellularGeneration(val value: String) {
  CELLULAR_GEN_2G("2G"),
  CELLULAR_GEN_3G("3G"),
  CELLULAR_GEN_4G("4G"),
  CELLULAR_GEN_5G("5G"),
  UNKNOWN("UNKNOWN");
}