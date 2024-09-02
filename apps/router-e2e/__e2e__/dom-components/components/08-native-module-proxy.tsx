'use dom';

import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from 'react';

interface DbItem {
  id: number;
  name: string;
  value: string;
}

export default function Page(_: { dom?: import('expo/dom').DOMProps }) {
  const [dbItems, setDbItems] = useState<DbItem[]>([]);

  useEffect(() => {
    let db: SQLite.SQLiteDatabase;
    async function setup() {
      db = await SQLite.openDatabaseAsync('dom.db');
      await db.runAsync('DROP TABLE IF EXISTS items;');
      await db.runAsync(
        'CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT);'
      );
      await db.runAsync('INSERT INTO items (name, value) VALUES (?, ?), (?, ?), (?, ?);', [
        'Item 1',
        'Value 1',
        'Item 2',
        'Value 2',
        'Item 3',
        'Value 3',
      ]);
      const items = await db.getAllAsync<DbItem>('SELECT * FROM items;');
      setDbItems(items);
    }
    setup();
    return () => {
      db.closeAsync();
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <button
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007BFF',
          color: '#FFF',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
        onClick={() => {
          Speech.speak('Hello, world!');
        }}>
        Speak "Hello, world!"
      </button>
      <button
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007BFF',
          color: '#FFF',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
        onClick={() => {
          Haptics.impactAsync();
        }}>
        Haptics.impactAsync()
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {dbItems.map((item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
