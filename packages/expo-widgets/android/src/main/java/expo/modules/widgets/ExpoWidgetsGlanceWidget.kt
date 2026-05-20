package expo.modules.widgets

import android.content.Context
import android.util.Log
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.provideContent

internal class ExpoWidgetsGlanceWidget(
  private val widgetName: String
) : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    GlanceAppWidgetManager(context).getAppWidgetId(id)

    provideContent {
      val layout = WidgetsStorage.getWidgetLayout(context, widgetName)

      val result = WidgetsJSRuntime.render(
        context = context,
        layout = layout ?: ""
//        layout = "function(props = {count:1},environment = {}){var count=props.count??0;return _jsxs(Box,{modifiers:[fillMaxSize(),background('#1E293B'),paddingAll(12)],children:[_jsx(Text,{color:\"#93C5FD\",style:{fontSize:13,fontWeight:'500'},children:\"Expo Widgets\"}),_jsx(Spacer,{modifiers:[height(8)]}),_jsx(Text,{color:\"#CBD5E1\",style:{fontSize:12},children:props.count})]});}"
//        layout = "function(props = {count:1},environment = {}){var count=props.count??0;return _jsxs(Column,{horizontalAlignment:\"start\",modifiers:[paddingAll(14),background('#101827'),defaultMinSize({minHeight:210})],children:[_jsx(Text,{color:\"#93C5FD\",style:{fontSize:13,fontWeight:'500'},children:\"Expo Widgets\"}),_jsx(Spacer,{modifiers:[height(8)]}),_jsx(Text,{color:\"#CBD5E1\",style:{fontSize:12},children:environment.widgetFamily})]});}"
//        layout = "() => ({\"type\":\"ColumnView\",\"props\":{\"horizontalAlignment\":\"start\",\"modifiers\":[{\"\$type\":\"background\",\"color\":\"#101827\"}],\"children\":[{\"type\":\"TextView\",\"props\":{\"color\":\"#93C5FD\",\"style\":{\"fontSize\":13,\"fontWeight\":\"500\"},\"children\":\"Expo Widgets\"}}]}})"
      )
      Log.d("sadas", widgetName)
      Log.d("sadas", result.toString())
      DynamicView(result)
    }
  }
}
