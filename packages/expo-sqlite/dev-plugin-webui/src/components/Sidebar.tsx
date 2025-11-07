import { Database, Download, FileText, Key, Table as TableIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SidebarProps {
  dbName: string | null;
  dbSource: 'file' | 'devtools' | null;
  isKVStore: boolean;
  tables: string[];
  selectedTable: string | null;
  selectedView: 'kvstore' | 'table';
  onKVStoreSelect: () => void;
  onTableSelect: (table: string) => void;
  onCloseDatabase: () => void;
  onExportDatabase?: () => Promise<Uint8Array>;
  onExportDatabaseAsSQL?: () => Promise<string>;
}

export function Sidebar({
  dbName,
  dbSource,
  isKVStore,
  tables,
  selectedTable,
  selectedView,
  onKVStoreSelect,
  onTableSelect,
  onCloseDatabase,
  onExportDatabase,
  onExportDatabaseAsSQL,
}: SidebarProps) {
  const [exporting, setExporting] = useState(false);
  const [exportingSQL, setExportingSQL] = useState(false);

  const handleExport = async () => {
    if (!onExportDatabase) return;
    try {
      setExporting(true);
      const data = await onExportDatabase();

      const blob = new Blob([data as BlobPart], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dbName || 'database.db';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('Database exported successfully!');
    } catch (err: any) {
      toast.error(`Failed to export database: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAsSQL = async () => {
    if (!onExportDatabaseAsSQL) return;
    try {
      setExportingSQL(true);
      const sqlDump = await onExportDatabaseAsSQL();

      const blob = new Blob([sqlDump], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (dbName?.replace(/\.db$/, '') || 'database') + '.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('Database exported as SQL successfully!');
    } catch (err: any) {
      toast.error(`Failed to export database as SQL: ${err.message}`);
    } finally {
      setExportingSQL(false);
    }
  };

  return (
    <aside className="w-64 border-r bg-card p-4 flex flex-col h-screen">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardDescription className="text-xs uppercase">Database</CardDescription>
          </div>
          <CardTitle className="text-base truncate" title={dbName || ''}>
            {dbName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dbSource && (
            <div className="flex items-center gap-2 text-sm pb-3">
              {dbSource === 'devtools' ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                  <span className="text-muted-foreground">Live mode</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0" />
                  <span className="text-muted-foreground">Read-only copy</span>
                </>
              )}
            </div>
          )}
          {onExportDatabase && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || exportingSQL}
              className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Database'}
            </Button>
          )}
          {onExportDatabaseAsSQL && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAsSQL}
              disabled={exporting || exportingSQL}
              className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              {exportingSQL ? 'Exporting...' : 'Export as SQL'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onCloseDatabase}
            disabled={exporting || exportingSQL}
            className="w-full">
            Close Database
          </Button>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-auto">
        {isKVStore && (
          <>
            <div className="mb-2 flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Storage</h3>
            </div>
            <div className="space-y-1 mb-4">
              <Button
                variant={selectedView === 'kvstore' ? 'secondary' : 'ghost'}
                className="w-full justify-start font-normal"
                size="sm"
                onClick={onKVStoreSelect}>
                <span className="truncate" title="KV Store">
                  KV Store
                </span>
              </Button>
            </div>
          </>
        )}

        <div className="mb-2 flex items-center gap-2">
          <TableIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Tables ({tables.length})</h3>
        </div>

        {tables.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No tables found</p>
        ) : (
          <div className="space-y-1">
            {tables.map((table) => (
              <Button
                key={table}
                variant={
                  selectedView === 'table' && selectedTable === table ? 'secondary' : 'ghost'
                }
                className="w-full justify-start font-normal"
                size="sm"
                onClick={() => onTableSelect(table)}>
                <span className="truncate" title={table}>
                  {table}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
