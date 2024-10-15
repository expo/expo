import { useEvent } from 'expo';
import <%- project.name %>, { <%- project.viewName %> } from '<%- project.slug %>';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';


export default function App() {
  const onChangePayload = useEvent(<%- project.name %>, "onChange");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Module API Example</Text>
      <Group name="Constants">
        <Text>{<%- project.name %>.PI}</Text>
      </Group>
      <Group name="Functions">
        <Text>{<%- project.name %>.hello()}</Text>
      </Group>
      <Group name="Async functions">
        <Button
          title="Set value"
          onPress={async () => {
            await <%- project.name %>.setValueAsync("Hello from JS!");
          }}
        />
      </Group>
      <Group name="Events">
        <Text>{onChangePayload?.value}</Text>
      </Group>
      <Group name="Views">
        <<%- project.viewName %>
          url="https://www.example.com"
          onLoad={({ url }) => console.log(`Loaded: ${url}`)}
        />
      </Group>
    </ScrollView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
});
