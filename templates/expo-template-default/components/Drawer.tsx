import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, useState } from "react";
import {
  LayoutAnimation,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";

export function Drawer({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? "light";

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((value) => !value);
  };

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward-outline"}
          size={18}
          color={theme === "light" ? Colors.light.icon : Colors.dark.icon}
        />
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      <ThemedView style={styles.content}>{isOpen ? children : null}</ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  content: {
    marginLeft: 24,
  }
});
