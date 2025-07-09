package expo.modules.devmenu.compose.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object Sizing {
  object Border {
    val hairlineWidth = Dp.Hairline
    val default = 1.dp
  }

  val border = Border

  object BorderRadius {
    val none = 0.dp
    val extraSmall = 2.dp
    val small = 4.dp
    val medium = 6.dp
    val large = 10.dp
    val extraLarge = 16.dp
    val twoExtraLarge = 20.dp
    val threeExtraLarge = 24.dp
    val full = 9999.dp
  }

  val borderRadius = BorderRadius

  object Icon {
    val extraSmall = 16.dp
    val small = 20.dp
    val medium = 24.dp
    val large = 28.dp
    val extraLarge = 32.dp
  }

  val icon = Icon
}
