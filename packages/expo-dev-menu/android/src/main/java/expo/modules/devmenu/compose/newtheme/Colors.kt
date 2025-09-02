package expo.modules.devmenu.compose.newtheme

import androidx.compose.ui.graphics.Color
import io.github.lukmccall.colors.RadixPallet
import io.github.lukmccall.colors.blue
import io.github.lukmccall.colors.gray
import io.github.lukmccall.colors.yellow

class Colors(private val pallet: RadixPallet<Color>) {
  data class Button(
    val foreground: Color,
    val background: Color
  )

  inner class Text internal constructor() {
    val default = pallet.gray.`12`
    val secondary = pallet.gray.`11`
    val tertiary = pallet.gray.`10`
    val quaternary = pallet.gray.`9`

    val link = pallet.blue.`11`
    val warning = pallet.yellow.`11`
  }

  inner class Background internal constructor() {
    val default = if (pallet.isDark) {
      pallet.gray.`1`
    } else {
      Color.White
    }

    val subtle = pallet.gray.`2`
    val element = pallet.gray.`3`

    val warning = pallet.yellow.`3`
    val info = pallet.blue.`3`
  }

  inner class Icon internal constructor() {
    val default = pallet.gray.`11`
    val secondary = pallet.gray.`10`
    val tertiary = pallet.gray.`9`
    val quaternary = pallet.gray.`8`

    val warning = pallet.yellow.`11`
    val info = pallet.blue.`10`
  }

  inner class Border internal constructor() {
    val default = pallet.gray.`7`
    val secondary = pallet.gray.`6`
    val error = pallet.gray.`6`
  }

  inner class Buttons internal constructor() {
    val primary = Button(
      foreground = Color.White,
      background = if (pallet.isDark) {
        pallet.blue.`8`
      } else {
        pallet.blue.`10`
      }
    )

    val secondary = Button(
      foreground = if (pallet.isDark) {
        Color.White
      } else {
        pallet.gray.`12`
      },
      background = if (pallet.isDark) {
        pallet.gray.`3`
      } else {
        Color.White
      }
    )

    val tertiary = Button(
      foreground = if (pallet.isDark) {
        pallet.blue.`11`
      } else {
        pallet.blue.`10`
      },
      background = Color.Transparent
    )
  }

  val text = Text()
  val background = Background()
  val icon = Icon()
  val border = Border()
  val buttons = Buttons()
}
