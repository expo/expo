import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ drawerLabel: 'Drawer Home', title: 'Home' }} />
      <Drawer.Screen name="second" options={{ drawerLabel: 'Drawer Second', title: 'Second' }} />
    </Drawer>
  );
}
