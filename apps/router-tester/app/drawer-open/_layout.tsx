import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <Drawer defaultStatus="open">
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: 'Open Drawer Item', title: 'Open Home' }}
      />
    </Drawer>
  );
}
