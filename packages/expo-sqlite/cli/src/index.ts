import {
  runCliExtension,
  createCliDevToolsPluginClient,
  sendDevToolsRequestAsync,
} from '@expo/devtools';

const PLUGIN_NAME = 'expo-sqlite';

const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

runCliExtension<{
  list_databases: Record<string, never>;
  get_database: { name: string };
  execute_query: { name: string; query: string };
  list_tables: { name: string };
  get_table_schema: { name: string; table: string };
}>(async ({ command, args, app }, console) => {
  const client = await createCliDevToolsPluginClient(PLUGIN_NAME, app, {
    websocketBinaryType: 'arraybuffer',
  });

  try {
    switch (command) {
      case 'list_databases': {
        const response = await sendDevToolsRequestAsync(client, 'listDatabases');
        if (response.method === 'listDatabases') {
          console.info(
            `${blue(app.title)}: ${response.databases.map((d: any) => d.name).join(', ') || 'No databases registered.'}`
          );
        } else if (response.method === 'error') {
          throw new Error(response.error);
        }
        break;
      }
      case 'execute_query': {
        const response = await sendDevToolsRequestAsync(client, 'executeQuery', {
          databasePath: args.name,
          query: args.query,
        });
        if (response.method === 'executeQuery') {
          const { columns, rows, changes, lastInsertRowId } = response.result;
          if (rows.length > 0) {
            console.info(`${blue(app.title)}:\n\n${formatTable(columns, rows)}`);
          } else if (changes != null) {
            console.info(
              `${blue(app.title)}: ${changes} row(s) affected, last insert rowid: ${lastInsertRowId}`
            );
          } else {
            console.info(`${blue(app.title)}: Query returned no results.`);
          }
        } else if (response.method === 'error') {
          throw new Error(response.error);
        }
        break;
      }
      case 'list_tables': {
        const response = await sendDevToolsRequestAsync(client, 'listTables', {
          databasePath: args.name,
        });
        if (response.method === 'listTables') {
          console.info(`${blue(app.title)}: ${response.tables.join(', ') || 'No tables found.'}`);
        } else if (response.method === 'error') {
          throw new Error(response.error);
        }
        break;
      }
      case 'get_table_schema': {
        const response = await sendDevToolsRequestAsync(client, 'getTableSchema', {
          databasePath: args.name,
          tableName: args.table,
        });
        if (response.method === 'getTableSchema') {
          const columns = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'];
          console.info(`${blue(app.title)}:\n\n${formatTable(columns, response.schema)}`);
        } else if (response.method === 'error') {
          throw new Error(response.error);
        }
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
    }
  } finally {
    await client.closeAsync();
  }
});

function formatTable(columns: string[], rows: readonly Record<string, any>[]): string {
  if (rows.length === 0) return '(empty)';
  const widths = columns.map((col) =>
    Math.max(col.length, ...rows.map((row) => String(row[col] ?? '').length))
  );
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  const separator = widths.map((w) => '-'.repeat(w)).join('-|-');
  const body = rows.map((row) =>
    columns.map((col, i) => String(row[col] ?? '').padEnd(widths[i])).join(' | ')
  );
  return [header, separator, ...body].join('\n');
}
