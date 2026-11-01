package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.TextInput
import com.composeunstyled.UnstyledTextField
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun SearchInput(
  value: String,
  onValueChange: (String) -> Unit,
  placeholder: String = "Search",
  modifier: Modifier = Modifier
) {
  val keyboardController = LocalSoftwareKeyboardController.current
  UnstyledTextField(
    value = value,
    onValueChange = onValueChange,
    textColor = NewAppTheme.colors.text.default,
    textStyle = NewAppTheme.font.md,
    singleLine = true,
    modifier = modifier
      .fillMaxWidth()
      .border(
        width = 1.dp,
        shape = RoundedCornerShape(NewAppTheme.borderRadius.xl),
        color = NewAppTheme.colors.border.default
      )
      .clip(RoundedCornerShape(NewAppTheme.borderRadius.xl))
      .background(NewAppTheme.colors.background.element)
      .padding(NewAppTheme.spacing.`3`),
    keyboardOptions = KeyboardOptions(
      capitalization = KeyboardCapitalization.None,
      autoCorrectEnabled = false,
      keyboardType = KeyboardType.Text,
      imeAction = ImeAction.Search
    ),
    keyboardActions = KeyboardActions(
      onSearch = { keyboardController?.hide() }
    ),
    cursorBrush = SolidColor(NewAppTheme.colors.text.default.copy(alpha = 0.9f))
  ) {
    TextInput(
      placeholder = {
        NewText(
          text = placeholder,
          style = NewAppTheme.font.md,
          color = NewAppTheme.colors.text.secondary
        )
      }
    )
  }
}

@Composable
@Preview(showBackground = true, widthDp = 300)
fun SearchInputPreview() {
  SearchInput(
    value = "",
    onValueChange = {},
    placeholder = "Search branches and updates"
  )
}
