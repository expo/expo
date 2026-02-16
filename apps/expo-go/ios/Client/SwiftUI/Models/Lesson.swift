// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenu

struct Lesson: Identifiable {
  let id: Int
  let title: String
  let icon: String  // SF Symbol name
  let description: String  // Long description for lesson UI
  let shortDescription: String  // Short description for panel (max 5 words)
  let appCode: String

  /// Display name for the snack action panel (e.g., "Lesson 1: View & Text")
  var snackDisplayName: String {
    "Lesson \(id): \(title)"
  }

  /// Generate the data.js content for this lesson
  var dataCode: String {
    """
    export const title = "\(title)";
    export const description = "\(description)";
    """
  }

  /// Generate the Snack files dictionary for this lesson
  var snackFiles: [String: SnackSessionClient.SnackFile] {
    [
      "App.js": SnackSessionClient.SnackFile(
        path: "App.js",
        contents: appCode,
        isAsset: false
      ),
      "lesson-files/Lesson.js": SnackSessionClient.SnackFile(
        path: "lesson-files/Lesson.js",
        contents: Lesson.sharedLessonComponent,
        isAsset: false
      ),
      "lesson-files/data.js": SnackSessionClient.SnackFile(
        path: "lesson-files/data.js",
        contents: dataCode,
        isAsset: false
      )
    ]
  }

  /// Dependencies required by the lesson (uses "*" for preloaded modules)
  static let snackDependencies: [String: [String: Any]] = [
    "react-native-safe-area-context": ["version": "*"],
    "@expo/vector-icons": ["version": "*"],
    "@shopify/react-native-skia": ["version": "*"]
  ]
}

// MARK: - Shared Lesson Component

extension Lesson {
  /// The Lesson.js wrapper component shared by all lessons
  static let sharedLessonComponent = """
import { View, Text, ScrollView, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { description } from './data';

// Renders text with `code` spans and https:// URLs as links
function FormattedText({ children, style }) {
  if (typeof children !== 'string') {
    return <Text style={style}>{children}</Text>;
  }

  // Match `code` spans and https:// URLs
  const parts = children.split(/(`[^`]+`|https:\\/\\/[^\\s]+)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1);
          return <Text key={i} style={styles.code}>{code}</Text>;
        }
        if (part.startsWith('https://')) {
          // Display without https:// prefix
          const displayUrl = part.replace('https://', '');
          return (
            <Text
              key={i}
              style={styles.link}
              onPress={() => Linking.openURL(part)}
            >
              {displayUrl}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

function LessonContent({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {children}
      </ScrollView>

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <FormattedText style={styles.description}>{description}</FormattedText>
        <View style={styles.instructionBox}>
          <Text style={styles.instruction}>
            💡 Press the ⚙️ icon → Source code explorer → open <Text style={styles.bold}>App.js</Text> to edit this example. Drag the gear to move the panel if it's in the way.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Lesson({ children }) {
  return (
    <SafeAreaProvider>
      <LessonContent>{children}</LessonContent>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: '#c41a68',
    backgroundColor: '#f0f0f0',
  },
  link: {
    color: '#0077FF',
    textDecorationLine: 'underline',
  },
  instructionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0077FF',
  },
  instruction: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  bold: {
    fontWeight: 'bold',
  },
});
"""
}

// MARK: - All Lessons

extension Lesson {
  static let allLessons: [Lesson] = [
    // Lesson 1: View & Text
    Lesson(
      id: 1,
      title: "View & Text",
      icon: "rectangle.on.rectangle",
      description: "`<View>` is a container (like a div) and `<Text>` is the only way to display words. All visible text must be inside `<Text>`. Try changing the message or adding a second `<Text>`.",
      shortDescription: "Containers and displaying text",
      appCode: """
import Lesson from './lesson-files/Lesson';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <Lesson>
      <View style={styles.container}>
        <Text style={styles.text}>Hello, world!</Text>
      </View>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
});
"""
    ),

    // Lesson 2: Styling
    Lesson(
      id: 2,
      title: "Styling",
      icon: "paintbrush.fill",
      description: "Styles are JavaScript objects with camelCase names (`backgroundColor`, not background-color). Numbers are density-independent pixels — no 'px' needed. Try changing colors, bumping `fontSize` to 40, or adding `fontWeight: 'bold'`.",
      shortDescription: "JavaScript objects with camelCase",
      appCode: """
import Lesson from './lesson-files/Lesson';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <Lesson>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Learn React Native styling</Text>
      </View>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
"""
    ),

    // Lesson 3: Pressable & State
    Lesson(
      id: 3,
      title: "Pressable & State",
      icon: "hand.tap.fill",
      description: "`<Pressable>` fires `onPress` when tapped. `useState` stores a value and re-renders the screen when it changes. Try adding `onLongPress` to decrement, or reset to 0 at 10.",
      shortDescription: "Handle taps and store values",
      appCode: """
import { useState } from 'react';
import Lesson from './lesson-files/Lesson';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <Lesson>
      <View style={styles.container}>
        <Text style={styles.count}>{count}</Text>
        <Pressable style={styles.button} onPress={() => setCount(count + 1)}>
          <Text style={styles.buttonText}>Tap me!</Text>
        </Pressable>
      </View>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0077FF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
"""
    ),

    // Lesson 4: TextInput
    Lesson(
      id: 4,
      title: "TextInput",
      icon: "keyboard",
      description: "`<TextInput>` accepts keyboard input. Store text in state, pass it as `value`, and update via `onChangeText` to keep everything in sync. Try adding `keyboardType='numeric'` or `secureTextEntry`.",
      shortDescription: "Keyboard input synced to state",
      appCode: """
import { useState } from 'react';
import Lesson from './lesson-files/Lesson';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function App() {
  const [text, setText] = useState('');

  return (
    <Lesson>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Type something..."
          value={text}
          onChangeText={setText}
        />
        <Text style={styles.echo}>You typed: {text}</Text>
      </View>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  echo: {
    fontSize: 16,
    color: '#666',
  },
});
"""
    ),

    // Lesson 5: Mini Todo List
    Lesson(
      id: 5,
      title: "Mini Todo List",
      icon: "checklist",
      description: "This combines everything: `View`, `Text`, `TextInput`, `Pressable`, `useState`, and `ScrollView`. Try adding delete-on-tap (hint: `filter` by index) or a 'done' style.",
      shortDescription: "Combine everything into an app",
      appCode: """
import { useState } from 'react';
import Lesson from './lesson-files/Lesson';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';

export default function App() {
  const [text, setText] = useState('');
  const [todos, setTodos] = useState([]);

  const addTodo = () => {
    if (text.trim()) {
      setTodos([...todos, text.trim()]);
      setText('');
    }
  };

  return (
    <Lesson>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a todo..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTodo}
          />
          <Pressable style={styles.addButton} onPress={addTodo}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        {todos.length === 0 ? (
          <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
        ) : (
          todos.map((todo, index) => (
            <View key={index} style={styles.todoItem}>
              <Text style={styles.todoText}>{todo}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#0077FF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todoItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  todoText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
});
"""
    ),

    // Lesson 6: Icons
    Lesson(
      id: 6,
      title: "Icons",
      icon: "star.fill",
      description: "`@expo/vector-icons` includes thousands of icons from popular sets like Ionicons, MaterialIcons, and FontAwesome. Just import and use with `name`, `size`, and `color`. Browse all icons at https://icons.expo.fyi",
      shortDescription: "Add icons from popular sets",
      appCode: """
import Lesson from './lesson-files/Lesson';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function App() {
  return (
    <Lesson>
      <View style={styles.container}>
        <View style={styles.row}>
          <Ionicons name="heart" size={48} color="#FF3B30" />
          <MaterialIcons name="star" size={48} color="#FFD700" />
          <FontAwesome name="rocket" size={48} color="#0077FF" />
        </View>
        <Text style={styles.hint}>Try: "home", "settings", "camera"</Text>
      </View>
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  hint: {
    fontSize: 14,
    color: '#666',
  },
});
"""
    ),

    // Lesson 7: Drawing with Skia
    Lesson(
      id: 7,
      title: "2D Graphics",
      icon: "paintpalette.fill",
      description: "Draw on a `<Canvas>` using shape components like `<Circle>`, `<Rect>`, and `<RoundedRect>`. Nest a `<LinearGradient>` inside any shape for smooth color blends. Try changing the gradient `colors`, moving shapes with `cx`/`cy`, adjusting `opacity`, or adding more `<Circle>` elements.",
      shortDescription: "Draw shapes and gradients",
      appCode: """
import Lesson from './lesson-files/Lesson';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, Circle, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';

function Drawing() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const size = width - 32;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Canvas style={{ width: size, height: size }}>
        <RoundedRect x={0} y={0} width={size} height={size} r={24} color="#1a1a2e" />
        <Circle cx={size / 2} cy={size / 2} r={100}>
          <LinearGradient
            start={vec(size / 2 - 100, size / 2 - 100)}
            end={vec(size / 2 + 100, size / 2 + 100)}
            colors={['#e94560', '#0f3460']}
          />
        </Circle>
        <Circle cx={size * 0.25} cy={size * 0.3} r={30} color="#4ECDC4" opacity={0.7} />
        <Circle cx={size * 0.78} cy={size * 0.65} r={40} color="#FFD93D" opacity={0.6} />
      </Canvas>
    </View>
  );
}

export default function App() {
  return (
    <Lesson>
      <Drawing />
    </Lesson>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
"""
    )
  ]
}
