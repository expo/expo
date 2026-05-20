package expo.modules.widgets.ui

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.ui.ExpoUIView

class WidgetsUIModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoWidgetsUI")

    ExpoUIView<TextProps>("TextView") {
      Content { props ->
        TextView(props)
      }
    }

    ExpoUIView<ButtonProps>("Button") {
      Content { props ->
        ButtonView(props)
      }
    }

    ExpoUIView<ButtonProps>("FilledTonalButton") {
      Content { props ->
        ButtonView(props)
      }
    }

    ExpoUIView<ButtonProps>("OutlinedButton") {
      Content { props ->
        ButtonView(props)
      }
    }

    ExpoUIView<ButtonProps>("ElevatedButton") {
      Content { props ->
        ButtonView(props)
      }
    }

    ExpoUIView<ButtonProps>("TextButton") {
      Content { props ->
        ButtonView(props)
      }
    }

    ExpoUIView<ColumnProps>("ColumnView") {
      Content { props ->
        ColumnView(props)
      }
    }

    ExpoUIView<RowProps>("RowView") {
      Content { props ->
        RowView(props)
      }
    }

    ExpoUIView<BoxProps>("BoxView") {
      Content { props ->
        BoxView(props)
      }
    }

    ExpoUIView<SpacerProps>("SpacerView") {
      Content { props ->
        SpacerView(props)
      }
    }

    ExpoUIView<CheckboxProps>("CheckboxView") {
      Content { props ->
        CheckboxView(props)
      }
    }

    ExpoUIView<RadioButtonProps>("RadioButtonView") {
      Content { props ->
        RadioButtonView(props)
      }
    }

    ExpoUIView<SwitchProps>("SwitchView") {
      Content { props ->
        SwitchView(props)
      }
    }

    ExpoUIView<LinearProgressIndicatorProps>("LinearProgressIndicatorView") {
      Content { props ->
        LinearProgressIndicatorView(props)
      }
    }

    ExpoUIView<CircularProgressIndicatorProps>("CircularProgressIndicatorView") {
      Content { props ->
        CircularProgressIndicatorView(props)
      }
    }

    ExpoUIView<LoadingIndicatorProps>("LoadingIndicatorView") {
      Content { props ->
        LoadingIndicatorView(props)
      }
    }
  }
}
