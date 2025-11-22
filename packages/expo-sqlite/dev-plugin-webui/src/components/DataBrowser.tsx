import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { InsertForm } from '@/components/InsertForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ColumnInfo, QueryResult } from '@/types';
import { toast } from 'sonner';

interface DataBrowserProps {
  tableName: string;
  schema: ColumnInfo[];
  onLoadData: (limit: number, offset: number) => Promise<QueryResult>;
  onUpdate: (values: Record<string, any>, where: string, whereParams: any[]) => Promise<void>;
  onDelete: (where: string, whereParams: any[]) => Promise<void>;
  onInsert: (values: Record<string, any>) => Promise<void>;
}

export function DataBrowser({
  tableName,
  schema,
  onLoadData,
  onUpdate,
  onDelete,
  onInsert,
}: DataBrowserProps) {
  const [data, setData] = useState<QueryResult | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [originalEditingRow, setOriginalEditingRow] = useState<any | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [insertDialogOpen, setInsertDialogOpen] = useState(false);
  const limit = 50;

  const loadData = useCallback(
    async (newOffset: number) => {
      setLoading(true);
      try {
        const result = await onLoadData(limit, newOffset);
        setData(result);
        setOffset(newOffset);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    },
    [onLoadData]
  );

  const handleEdit = (row: any) => {
    setOriginalEditingRow(row);
    setEditingRow({ ...row });
  };

  const handleSave = async () => {
    if (!editingRow || !originalEditingRow) return;

    const pkCols = schema.filter((col) => col.pk);
    if (pkCols.length === 0) {
      toast.error('No primary key found. Cannot update row.');
      return;
    }

    const whereClause = pkCols.map((col) => `${col.name} = ?`).join(' AND ');
    const whereParams = pkCols.map((col) => originalEditingRow[col.name]);

    const values: Record<string, any> = {};
    for (const key in editingRow) {
      if (!pkCols.find((col) => col.name === key)) {
        values[key] = editingRow[key];
      }
    }

    try {
      await onUpdate(values, whereClause, whereParams);
      setEditingRow(null);
      setOriginalEditingRow(null);
      await loadData(offset);
    } catch (err) {
      console.error('Failed to update row:', err);
    }
  };

  const handleDelete = async (row: any) => {
    const pkCols = schema.filter((col) => col.pk);
    if (pkCols.length === 0) {
      toast.error('No primary key found. Cannot delete row.');
      return;
    }

    if (!confirm('Are you sure you want to delete this row?')) {
      return;
    }

    const whereClause = pkCols.map((col) => `${col.name} = ?`).join(' AND ');
    const whereParams = pkCols.map((col) => row[col.name]);

    try {
      await onDelete(whereClause, whereParams);
      await loadData(offset);
    } catch (err) {
      console.error('Failed to delete row:', err);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setOriginalEditingRow(null);
  };

  const handleInsert = async (values: Record<string, any>) => {
    try {
      await onInsert(values);
      setInsertDialogOpen(false);
      await loadData(offset);
    } catch (err) {
      console.error('Failed to insert row:', err);
      throw err;
    }
  };

  const handlePrevious = () => {
    if (offset > 0) {
      loadData(Math.max(0, offset - limit));
    }
  };

  const handleNext = () => {
    if (data && data.rows.length === limit) {
      loadData(offset + limit);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data) return null;

    let filteredRows = data.rows;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredRows = filteredRows.filter((row) =>
        data.columns?.some((col) =>
          String(row[col] ?? '')
            .toLowerCase()
            .includes(searchLower)
        )
      );
    }

    if (sortColumn && data.columns?.includes(sortColumn)) {
      filteredRows = [...filteredRows].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
        if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return {
      rows: filteredRows,
      columns: data.columns,
    };
  }, [data, searchText, sortColumn, sortDirection]);

  useEffect(() => {
    loadData(0);
  }, [loadData, tableName]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Browse: {tableName}</CardTitle>
              <CardDescription>View and manage table data</CardDescription>
            </div>
            <Button onClick={() => setInsertDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Insert Row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in all columns..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={offset === 0 || loading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!data || data.rows.length < limit || loading}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedData && (
                <>
                  Showing {filteredAndSortedData.rows.length} of {data?.rows.length || 0} rows
                  {searchText && ' (filtered)'}
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 overflow-auto px-6 pb-6">
        {filteredAndSortedData && (
          <DataTable
            data={filteredAndSortedData}
            editable
            editingRow={editingRow}
            originalEditingRow={originalEditingRow}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onEditChange={setEditingRow}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      <Dialog open={insertDialogOpen} onOpenChange={setInsertDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert New Row</DialogTitle>
            <DialogDescription>Add a new record to the {tableName} table</DialogDescription>
          </DialogHeader>
          <InsertForm tableName={tableName} schema={schema} onInsert={handleInsert} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
