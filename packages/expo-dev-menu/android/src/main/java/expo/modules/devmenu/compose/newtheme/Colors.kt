package expo.modules.devmenu.compose.newtheme

import androidx.compose.ui.graphics.Color
import io.github.lukmccall.colors.RadixPallet
import io.github.lukmccall.colors.blue
import io.github.lukmccall.colors.gray
import io.github.lukmccall.colors.yellow

class Colors(private val pallet: RadixPallet<Color>) {
  inner class Text {
    val default = pallet.gray.`12`
    val secondary = pallet.gray.`11`
    val tertiary = pallet.gray.`10`
    val quaternary = pallet.gray.`9`

    val link = pallet.blue.`11`
    val warning = pallet.yellow.`11`
  }

  inner class Background {
    val default = if (pallet.isDark) {
      pallet.gray.`1`
    } else {
      Color.White
    }

    val subtle = pallet.gray.`2`
    val element = pallet.gray.`3`

    val warning = pallet.yellow.`3`
  }

  inner class Icon {
    val default = pallet.gray.`11`
    val secondary = pallet.gray.`10`
    val tertiary = pallet.gray.`9`
    val quaternary = pallet.gray.`8`

    val warning = pallet.yellow.`11`
  }

  inner class Border {
    val default = pallet.gray.`7`
    val error = pallet.gray.`6`
  }

  val text = Text()
  val background = Background()
  val icon = Icon()
  val border = Border()
}
