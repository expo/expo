import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Section } from '../components/Page';

interface Todo {
  id: number;
  title: string;
  done: number;
}

let db: SQLiteDatabase | null = null;

function getDatabase(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync('todos.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

function TodoApp() {
  const database = React.useMemo(() => getDatabase(), []);
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [text, setText] = React.useState('');

  const loadTodos = React.useCallback(async () => {
    const result = await database.getAllAsync<Todo>('SELECT * FROM todos ORDER BY id DESC');
    setTodos(result);
  }, [database]);

  React.useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const addTodo = React.useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await database.runAsync('INSERT INTO todos (title, done) VALUES (?, 0)', trimmed);
    setText('');
    await loadTodos();
  }, [database, text, loadTodos]);

  const toggleTodo = React.useCallback(
    async (id: number, currentDone: number) => {
      await database.runAsync('UPDATE todos SET done = ? WHERE id = ?', currentDone ? 0 : 1, id);
      await loadTodos();
    },
    [database, loadTodos]
  );

  const deleteTodo = React.useCallback(
    async (id: number) => {
      await database.runAsync('DELETE FROM todos WHERE id = ?', id);
      await loadTodos();
    },
    [database, loadTodos]
  );

  const deleteAll = React.useCallback(async () => {
    Alert.alert('Delete All', 'Are you sure you want to delete all todos?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await database.runAsync('DELETE FROM todos');
          await loadTodos();
        },
      },
    ]);
  }, [database, loadTodos]);

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Section title={`Todos (${doneCount}/${todos.length} done)`}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a new todo..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={addTodo}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addTodo}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {todos.length === 0 ? (
        <Text style={styles.emptyText}>No todos yet. Add one above!</Text>
      ) : (
        <View>
          {todos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.todoRow}
              onPress={() => toggleTodo(item.id, item.done)}>
              <Text style={[styles.checkbox, item.done ? styles.checked : undefined]}>
                {item.done ? '☑' : '☐'}
              </Text>
              <Text
                style={[styles.todoText, item.done ? styles.doneText : undefined]}
                numberOfLines={1}>
                {item.title}
              </Text>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTodo(item.id)}>
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.clearButton} onPress={deleteAll}>
            <Text style={styles.clearButtonText}>Delete All</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

export default function SQLiteScreen() {
  return <TodoApp />;
}

SQLiteScreen.navigationOptions = {
  title: 'SQLite',
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#4630EB',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  checkbox: {
    fontSize: 22,
    marginRight: 10,
    color: '#888',
  },
  checked: {
    color: '#4630EB',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 15,
  },
  clearButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
