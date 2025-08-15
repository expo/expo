package expo.modules.devmenu.compose.newtheme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import expo.modules.devmenu.R

object Typography {
  val inter = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold)
  )

  val mono = FontFamily(
    Font(R.font.jetbrains_mono_light, FontWeight.Light),
    Font(R.font.jetbrains_mono_regular, FontWeight.Normal),
    Font(R.font.jetbrains_mono_medium, FontWeight.Medium)
  )

  val sm = TextStyle(
    fontSize = 12.sp
  )
  val md = TextStyle(
    fontSize = 14.sp
  )
  val lg = TextStyle(
    fontSize = 16.sp
  )
  val xl = TextStyle(
    fontSize = 18.sp
  )
  val xxl = TextStyle(
    fontSize = 20.sp
  )
}
