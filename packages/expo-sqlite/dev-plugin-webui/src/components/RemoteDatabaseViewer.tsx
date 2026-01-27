import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DataBrowser } from '@/components/DataBrowser';
import { KVStoreBrowser } from '@/components/KVStoreBrowser';
import { QueryEditor } from '@/components/QueryEditor';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSQLiteDatabaseRemote } from '@/hooks/useSQLiteDatabaseRemote';
import type { ColumnInfo } from '@/types';

interface RemoteDatabaseViewerProps {
  databasePath: string;
  databaseName: string;
  onClose: () => void;
}

export function RemoteDatabaseViewer({
  databasePath,
  databaseName,
  onClose,
}: RemoteDatabaseViewerProps) {
  const {
    dbName,
    dbSource,
    isKVStore,
    loading: dbLoading,
    error,
    setError,
    openDatabase,
    closeDatabase,
    listTables,
    getTableSchema,
    executeQuery,
    getTableData,
    insertRow,
    updateRow,
    deleteRow,
    getKVStoreKeys,
    getKVStoreItem,
    setKVStoreItem,
    removeKVStoreItem,
    clearKVStore,
    getKVStoreLength,
    exportDatabase,
    exportDatabaseAsSQL,
    isConnected,
  } = useSQLiteDatabaseRemote();

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'kvstore' | 'table'>('table');
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [activeTab, setActiveTab] = useState('browse');

  const loadTables = useCallback(async () => {
    try {
      const tableList = await listTables();
      setTables(tableList);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  }, [listTables]);

  const handleCloseDatabase = async () => {
    await closeDatabase();
    setTables([]);
    setSelectedTable(null);
    setSchema([]);
    onClose();
  };

  const handleKVStoreSelect = () => {
    setSelectedView('kvstore');
    setSelectedTable(null);
    setSchema([]);
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedView('table');
    setSelectedTable(tableName);
    setActiveTab('browse');
    try {
      const tableSchema = await getTableSchema(tableName);
      setSchema(tableSchema);
    } catch (err) {
      console.error('Failed to load table schema:', err);
    }
  };

  const handleUpdate = async (values: Record<string, any>, where: string, whereParams: any[]) => {
    if (!selectedTable || !updateRow) return;
    const changes = await updateRow(selectedTable, values, where, whereParams);
    toast(`Updated ${changes} row(s) successfully!`);
  };

  const handleDelete = async (where: string, whereParams: any[]) => {
    if (!selectedTable || !deleteRow) return;
    const changes = await deleteRow(selectedTable, where, whereParams);
    toast(`Deleted ${changes} row(s) successfully!`);
  };

  const handleInsert = async (values: Record<string, any>) => {
    if (!selectedTable || !insertRow) return;
    await insertRow(selectedTable, values);
  };

  useEffect(() => {
    openDatabase(databasePath, databaseName);
  }, [databasePath, databaseName, openDatabase]);

  useEffect(() => {
    if (databasePath && isConnected && dbName) {
      loadTables();
    }
  }, [databasePath, isConnected, dbName, loadTables]);

  if (!isConnected || !dbName) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Waiting for connection to React Native app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        dbName={dbName}
        dbSource={dbSource}
        isKVStore={isKVStore}
        tables={tables}
        selectedTable={selectedTable}
        selectedView={selectedView}
        onKVStoreSelect={handleKVStoreSelect}
        onTableSelect={handleTableSelect}
        onCloseDatabase={handleCloseDatabase}
        onExportDatabase={exportDatabase}
        onExportDatabaseAsSQL={exportDatabaseAsSQL}
      />

      <main className="flex-1 overflow-auto">
        {error && (
          <div className="m-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-destructive">Error</h5>
                <p className="text-sm text-destructive/90 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80 text-xl leading-none">
                ×
              </button>
            </div>
          </div>
        )}

        {selectedView === 'kvstore' ? (
          <KVStoreBrowser
            onGetKeys={getKVStoreKeys}
            onGetItem={getKVStoreItem}
            onSetItem={setKVStoreItem}
            onRemoveItem={removeKVStoreItem}
            onClear={clearKVStore}
            onGetLength={getKVStoreLength}
          />
        ) : !selectedTable ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">
                Select a table from the sidebar to get started
              </p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-6 pt-6">
              <TabsList>
                <TabsTrigger value="browse">Browse Data</TabsTrigger>
                <TabsTrigger value="query">SQL Query</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto">
              {dbLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}

              <TabsContent value="browse" className="m-0 h-full">
                <DataBrowser
                  tableName={selectedTable}
                  schema={schema}
                  onLoadData={(limit, offset) => getTableData(selectedTable, limit, offset)}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onInsert={handleInsert}
                />
              </TabsContent>

              <TabsContent value="query" className="m-0">
                <QueryEditor onExecuteQuery={executeQuery} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>
    </div>
  );
}
