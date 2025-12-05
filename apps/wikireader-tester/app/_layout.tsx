import {
  IconButton,
  Host,
  padding,
  Row,
  Shape,
  size,
  TextInput,
  weight,
} from '@expo/ui/jetpack-compose';
import {
  createDrawerNavigator,
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
} from '@expo/ui/jetpack-compose/drawer';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const DrawerNavigator = createDrawerNavigator().Navigator;

const DrawerCustom = withLayoutContext<
  DrawerNavigationOptions,
  typeof DrawerNavigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(DrawerNavigator);

function NativeDrawer() {
  const insets = useSafeAreaInsets();
  return (
    <DrawerCustom id={undefined}>
      <DrawerCustom.Screen
        name="index" // This is the name of the page and must match the url from root
        options={{
          drawerActiveTintColor: '#000000',
          // drawerLabel: ({ focused, color }) => (
          //   <Row verticalAlignment="center" horizontalArrangement="start">
          //     <Box modifiers={[]}>
          //       <SymbolView tintColor={color} size={24} name={{ android: '10mp' }}></SymbolView>
          //     </Box>
          //     <Text color={color} modifiers={[]}>
          //       Test
          //     </Text>
          //   </Row>
          // ),
          // drawerLabel: ({ focused }) => {},
          headerTransparent: true,
          header: (props) => (
            <Host
              style={{
                flex: 1,
                flexBasis: 0,
                height: 60,
                marginTop: insets.top,
                backgroundColor: '#FBF8FB',
              }}>
              <Row
                modifiers={[padding(0, 0, 16, 0)]}
                horizontalArrangement="spaceBetween"
                verticalAlignment="center">
                <IconButton
                  modifiers={[size(52, 52), padding(0, 0, 0, 0)]}
                  onPress={props.navigation.openDrawer}
                  //   color={Color.android.system_accent1_10.toString()}
                  shape={Shape.Circle({ radius: 1 })}>
                  {/* figure out host */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      justifyContent: 'center',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}>
                    <SymbolView size={24} tintColor="#333" name={{ android: 'menu' }} />
                  </View>
                </IconButton>
                {/* Add variant for textinput */}
                <TextInput defaultValue="Test" onChangeText={() => {}} modifiers={[weight(1)]} />
                <IconButton
                  variant="bordered"
                  modifiers={[size(40, 40), padding(8, 0, 0, 0)]}
                  onPress={console.log}
                  //   color={Color.android.system_accent1_10.toString()}
                  shape={Shape.Circle({ radius: 1 })}>
                  {/* figure out host */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      justifyContent: 'center',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}>
                    <SymbolView size={24} tintColor="#777" name={{ android: 'shuffle' }} />
                  </View>
                </IconButton>
              </Row>
            </Host>
          ),
        }}
      />
    </DrawerCustom>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <NativeDrawer />
    </SafeAreaProvider>
  );
}

// TODO: Consider Modifier.
// Native layout

/*
Cannot set prop 'modifiers' on view 'class expo.modules.ui.TextInputView'
→ Caused by: Cannot cast 'class com.facebook.react.bridge.DynamicFromMap' to 'expo.modules.ui.ExpoModifier' required by the collection of type: 'kotlin.collections.List<expo.modules.ui.ExpoModifier>'.
→ Caused by: java.lang.AssertionError 
*/

// Hot reload doesn't work for removing views
// autosizingcomposable move to host
// ensure fromExpoModifiers gets scope everywhere
// make new colors from Ubex work as props for tintColor
// remove style prop form all views that don;t have hosting view

// https://developer.android.com/reference/kotlin/androidx/compose/material3/pulltorefresh/package-summary#PullToRefreshBox(kotlin.Boolean,kotlin.Function0,androidx.compose.ui.Modifier,androidx.compose.material3.pulltorefresh.PullToRefreshState,androidx.compose.ui.Alignment,kotlin.Function1,kotlin.Function1)
