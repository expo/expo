import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// import { SymbolView} from 'expo-symbols'
export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        {/* <SymbolView name="star" size={64} color="#000" /> */}
        <Text style={styles.title}>Hello World</Text>
        <Link href="/second">Go to second page</Link>
        <Text style={styles.subtitle}>This is the first page of your app.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
