import { View, Text, StyleSheet } from "react-native";

export default function IconTestTab() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Icon Rendering Mode Test</Text>
			<Text style={styles.subtitle}>
				This tab uses an image icon with 'original' renderingMode.
			</Text>
			<Text style={styles.description}>
				The icon should display its original colors (the Expo orange icon)
				without being tinted by the system tab bar color.
			</Text>
			<Text style={styles.note}>
				Compare with other tabs that use SF Symbols or the default 'template'
				mode, which will be tinted with the system color.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		backgroundColor: "#f5f5f5",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 18,
		color: "#333",
		marginBottom: 12,
		textAlign: "center",
	},
	description: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 12,
		paddingHorizontal: 20,
	},
	note: {
		fontSize: 12,
		color: "#888",
		textAlign: "center",
		fontStyle: "italic",
		paddingHorizontal: 20,
	},
});
