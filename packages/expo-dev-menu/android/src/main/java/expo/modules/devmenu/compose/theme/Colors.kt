package expo.modules.devmenu.compose.theme

import androidx.compose.ui.graphics.Color
import expo.modules.devmenu.compose.fromHex

// Generated based expo/styleguide

data class Background(
  val default: Color,
  val screen: Color,
  val secondary: Color,
  val tertiary: Color,
  val quaternary: Color,
  val error: Color,
  val warning: Color,
  val success: Color,
  val overlay: Color
)

data class Border(
  val default: Color,
  val error: Color,
  val success: Color,
  val warning: Color
)

data class ButtonStyle(
  val background: Color,
  val foreground: Color,
  val border: Color? = null
)

data class Button(
  val primary: ButtonStyle,
  val secondary: ButtonStyle,
  val tertiary: ButtonStyle,
  val transparent: ButtonStyle,
  val ghost: ButtonStyle
)

data class Icon(
  val default: Color,
  val secondary: Color
)

data class Link(
  val default: Color
)

data class Status(
  val default: Color,
  val error: Color,
  val warning: Color,
  val success: Color,
  val info: Color
)

data class Text(
  val default: Color,
  val secondary: Color,
  val error: Color,
  val warning: Color,
  val success: Color,
  val link: Color
)

data class Code(
  val keyword: Color,
  val builtin: Color,
  val property: Color,
  val comment: Color,
  val punctuation: Color,
  val operator: Color,
  val regex: Color,
  val string: Color,
  val before: Color
)

data class Highlight(
  val accent: Color,
  val emphasis: Color
)

data class Project(
  val blue: Color,
  val green: Color,
  val yellow: Color,
  val orange: Color,
  val red: Color,
  val pink: Color,
  val purple: Color
)

data class Colors(
  val background: Background,
  val border: Border,
  val button: Button,
  val icon: Icon,
  val link: Link,
  val status: Status,
  val text: Text,
  val code: Code,
  val highlight: Highlight,
  val project: Project
)

val lightColors = Colors(
  background = Background(
    default = Pallet.white,
    screen = Pallet.Light.Gray.gray100,
    secondary = Pallet.Light.Gray.gray100,
    tertiary = Pallet.Light.Gray.gray200,
    quaternary = Pallet.Light.Gray.gray300,
    error = Pallet.Light.Red.red100,
    warning = Pallet.Light.Yellow.yellow100,
    success = Pallet.Light.Green.green100,
    overlay = Pallet.white
  ),
  border = Border(
    default = Pallet.Light.Gray.gray300,
    error = Pallet.Light.Red.red300,
    success = Pallet.Light.Green.green300,
    warning = Pallet.Light.Yellow.yellow300
  ),
  button = Button(
    primary = ButtonStyle(
      background = Pallet.Light.Primary.primary500,
      foreground = Pallet.white
    ),
    secondary = ButtonStyle(
      background = Pallet.Light.Gray.gray200,
      foreground = Pallet.black
    ),
    tertiary = ButtonStyle(
      background = Pallet.black,
      foreground = Pallet.white
    ),
    transparent = ButtonStyle(
      background = Color.Transparent,
      foreground = Pallet.black
    ),
    ghost = ButtonStyle(
      background = Color.Transparent,
      foreground = Pallet.Light.Gray.gray800,
      border = Pallet.Light.Gray.gray400
    )
  ),
  icon = Icon(
    default = Pallet.Light.Gray.gray700,
    secondary = Pallet.Light.Gray.gray500
  ),
  link = Link(
    default = Pallet.Light.Primary.primary500
  ),
  status = Status(
    default = Pallet.Light.Gray.gray500,
    error = Pallet.Light.Red.red500,
    warning = Pallet.Light.Yellow.yellow500,
    success = Pallet.Light.Green.green500,
    info = Pallet.Light.Blue.blue500
  ),
  text = Text(
    default = Pallet.black,
    secondary = Pallet.Light.Gray.gray700,
    error = Pallet.Light.Red.red600,
    warning = Pallet.Light.Yellow.yellow900,
    success = Pallet.Light.Green.green600,
    link = Pallet.Light.Primary.primary500
  ),
  code = Code(
    keyword = Pallet.Light.Blue.blue500,
    builtin = Pallet.Light.Green.green600,
    property = Pallet.Light.Red.red500,
    comment = Pallet.Light.Gray.gray600,
    punctuation = Pallet.Light.Gray.gray700,
    operator = Pallet.Light.Yellow.yellow800,
    regex = Pallet.Light.Orange.orange600,
    string = Pallet.Light.Yellow.yellow700,
    before = Pallet.Light.Gray.gray400
  ),
  highlight = Highlight(
    accent = Pallet.Light.Primary.primary300,
    emphasis = Pallet.Light.Yellow.yellow300
  ),
  project = Project(
    blue = Color.fromHex("#6299d9"),
    green = Color.fromHex("#54a767"),
    yellow = Color.fromHex("#e5c145"),
    orange = Color.fromHex("#d9864c"),
    red = Color.fromHex("#d95757"),
    pink = Color.fromHex("#d977b2"),
    purple = Color.fromHex("#8a66cc")
  )
)

val darkColors = Colors(
  background = Background(
    default = Pallet.Dark.Gray.gray100,
    screen = Pallet.Dark.Gray.gray000,
    secondary = Pallet.Dark.Gray.gray200,
    tertiary = Pallet.Dark.Gray.gray300,
    quaternary = Pallet.Dark.Gray.gray400,
    error = Pallet.Dark.Red.red000,
    warning = Pallet.Dark.Yellow.yellow000,
    success = Pallet.Dark.Green.green000,
    overlay = Pallet.Dark.Gray.gray100
  ),
  border = Border(
    default = Pallet.Dark.Gray.gray400,
    error = Pallet.Dark.Red.red200,
    success = Pallet.Dark.Green.green200,
    warning = Pallet.Dark.Yellow.yellow200
  ),
  button = Button(
    primary = ButtonStyle(
      background = Pallet.Dark.Primary.primary500,
      foreground = Pallet.white
    ),
    secondary = ButtonStyle(
      background = Pallet.Dark.Gray.gray300,
      foreground = Pallet.white
    ),
    tertiary = ButtonStyle(
      background = Pallet.Dark.Gray.gray900,
      foreground = Pallet.black
    ),
    transparent = ButtonStyle(
      background = Color.Transparent,
      foreground = Pallet.Dark.Gray.gray800
    ),
    ghost = ButtonStyle(
      background = Color.Transparent,
      foreground = Pallet.Dark.Gray.gray800,
      border = Pallet.Dark.Gray.gray400
    )
  ),
  icon = Icon(
    default = Pallet.Dark.Gray.gray800,
    secondary = Pallet.Dark.Gray.gray600
  ),
  link = Link(
    default = Pallet.Dark.Primary.primary700
  ),
  status = Status(
    default = Pallet.Dark.Gray.gray400,
    error = Pallet.Dark.Red.red500,
    warning = Pallet.Dark.Yellow.yellow500,
    success = Pallet.Dark.Green.green500,
    info = Pallet.Dark.Blue.blue500
  ),
  text = Text(
    default = Pallet.Dark.Gray.gray800,
    secondary = Pallet.Dark.Gray.gray600,
    error = Pallet.Dark.Red.red600,
    warning = Pallet.Dark.Yellow.yellow900,
    success = Pallet.Dark.Green.green600,
    link = Pallet.Dark.Primary.primary500
  ),
  code = Code(
    keyword = Pallet.Dark.Blue.blue600,
    builtin = Pallet.Dark.Green.green600,
    property = Pallet.Dark.Red.red600,
    comment = Pallet.Dark.Gray.gray600,
    punctuation = Pallet.Dark.Gray.gray700,
    operator = Pallet.Dark.Yellow.yellow800,
    regex = Pallet.Dark.Orange.orange600,
    string = Pallet.Dark.Yellow.yellow700,
    before = Pallet.Dark.Gray.gray400
  ),
  highlight = Highlight(
    accent = Pallet.Dark.Primary.primary700,
    emphasis = Pallet.Dark.Yellow.yellow300
  ),
  project = Project(
    blue = Color.fromHex("#395a80"),
    green = Color.fromHex("#32633d"),
    yellow = Color.fromHex("#8a6319"),
    orange = Color.fromHex("#8c5731"),
    red = Color.fromHex("#8c3838"),
    pink = Color.fromHex("#8a4c71"),
    purple = Color.fromHex("#4e3973")
  )
)
