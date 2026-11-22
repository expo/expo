# The launch screen snapshot reads React Native's internal text view and style span through reflection.
-keep class com.facebook.react.views.text.PreparedLayoutTextView {
  public com.facebook.react.views.text.PreparedLayout getPreparedLayout();
}
-keep class com.facebook.react.views.text.PreparedLayout {
  public android.text.Layout getLayout();
  public float getVerticalOffset();
}
-keep class com.facebook.react.views.text.internal.span.CustomStyleSpan {
  public java.lang.String getFontFamily();
}
