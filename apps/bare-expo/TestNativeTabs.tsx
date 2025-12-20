import React from "react";
import { View, Text } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TestNativeTabs() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="home">
				<NativeTabs.Trigger.Icon
					src={require("./assets/icon.png")}
					renderingMode="template"
				/>
				<NativeTabs.Trigger.Label>Home (Template)</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="settings">
				<NativeTabs.Trigger.Icon
					src={require("./assets/icon.png")}
					renderingMode="original"
				/>
				<NativeTabs.Trigger.Label>Settings (Original)</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
