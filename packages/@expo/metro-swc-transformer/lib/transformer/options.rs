use string_cache::Atom;
use swc::{
  atoms::JsWordStaticSet,
  config::{Config, JsMinifyOptions, JscConfig, ModuleConfig, Options, TransformConfig},
};
use swc_config::config_types::{BoolConfig, BoolOrDataConfig};
use swc_ecma_parser::{EsConfig, Syntax, TsConfig};
use swc_ecma_transforms_module as module;
use swc_ecma_transforms_react as react;
use swc_ecma_utils::swc_ecma_ast::EsVersion;

const LAZY_IMPORTS: &'static [&'static str] = &[
  "AccessibilityInfo",
  "ActivityIndicator",
  "Button",
  "DatePickerIOS",
  "DrawerLayoutAndroid",
  "FlatList",
  "Image",
  "ImageBackground",
  "InputAccessoryView",
  "KeyboardAvoidingView",
  "Modal",
  "Pressable",
  "ProgressBarAndroid",
  "ProgressViewIOS",
  "SafeAreaView",
  "ScrollView",
  "SectionList",
  "Slider",
  "Switch",
  "RefreshControl",
  "StatusBar",
  "Text",
  "TextInput",
  "Touchable",
  "TouchableHighlight",
  "TouchableNativeFeedback",
  "TouchableOpacity",
  "TouchableWithoutFeedback",
  "View",
  "VirtualizedList",
  "VirtualizedSectionList",
  "ActionSheetIOS",
  "Alert",
  "Animated",
  "Appearance",
  "AppRegistry",
  "AppState",
  "AsyncStorage",
  "BackHandler",
  "Clipboard",
  "DeviceInfo",
  "Dimensions",
  "Easing",
  "ReactNative",
  "I18nManager",
  "InteractionManager",
  "Keyboard",
  "LayoutAnimation",
  "Linking",
  "LogBox",
  "NativeEventEmitter",
  "PanResponder",
  "PermissionsAndroid",
  "PixelRatio",
  "PushNotificationIOS",
  "Settings",
  "Share",
  "StyleSheet",
  "Systrace",
  "ToastAndroid",
  "TVEventHandler",
  "UIManager",
  "ReactNative",
  "UTFSequence",
  "Vibration",
  "RCTDeviceEventEmitter",
  "RCTNativeAppEventEmitter",
  "NativeModules",
  "Platform",
  "processColor",
  "requireNativeComponent",
];

fn get_module_config() -> ModuleConfig {
  let lazy_imports: Vec<Atom<JsWordStaticSet>> = LAZY_IMPORTS.iter().map(|&s| s.into()).collect();
  let module_config = ModuleConfig::CommonJs(module::common_js::Config {
    strict: false,
    lazy: module::util::Lazy::List(lazy_imports),
    strict_mode: false,
    no_interop: false,
    ..Default::default()
  });
  module_config
}

pub fn get_config_options(is_typescript: bool) -> Options {
  let syntax = match is_typescript {
    true => Syntax::Typescript(TsConfig {
      tsx: true,
      ..Default::default()
    }),
    false => Syntax::Es(EsConfig {
      jsx: true,
      ..Default::default()
    }),
  };

  let opts = &Options {
    config: Config {
      jsc: JscConfig {
        loose: BoolConfig::new(Some(false)),
        target: Some(EsVersion::Es5),
        syntax: Some(syntax),
        minify: Some(JsMinifyOptions {
          compress: BoolOrDataConfig::from_bool(false),
          mangle: BoolOrDataConfig::from_bool(false),
          ..Default::default()
        }),
        transform: Some(TransformConfig {
          react: react::Options {
            runtime: Some(react::Runtime::Automatic),
            refresh: Some(react::RefreshOptions::default()),
            development: Some(true),
            ..Default::default()
          },
          ..Default::default()
        })
        .into(),
        ..Default::default()
      },
      module: Some(get_module_config()),
      ..Default::default()
    },
    ..Default::default()
  };

  opts.clone()
}
