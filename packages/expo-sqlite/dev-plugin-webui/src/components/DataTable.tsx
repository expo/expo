import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { QueryResult } from '@/types';

interface DataTableProps {
  data: QueryResult;
  editable?: boolean;
  editingRow?: any | null;
  originalEditingRow?: any | null;
  onEdit?: (row: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: (row: any) => void;
  onEditChange?: (updatedRow: any) => void;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

export function DataTable({
  data,
  editable = false,
  editingRow,
  originalEditingRow,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditChange,
  sortColumn,
  sortDirection,
  onSort,
}: DataTableProps) {
  if (!data.rows.length) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const isRowEditing = (row: any) => {
    return originalEditingRow && JSON.stringify(originalEditingRow) === JSON.stringify(row);
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {editable && <TableHead className="w-[150px]">Actions</TableHead>}
            {data.columns?.map((col) => (
              <TableHead key={col} className="min-w-[120px]">
                {onSort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => onSort(col)}>
                    <span className="font-medium">{col}</span>
                    {getSortIcon(col)}
                  </Button>
                ) : (
                  <span className="font-medium">{col}</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row, idx) => (
            <TableRow key={idx}>
              {editable && (
                <TableCell>
                  {isRowEditing(row) ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="default" onClick={() => onSave && onSave()}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={onCancel}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onEdit && onEdit(row)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => onDelete && onDelete(row)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </TableCell>
              )}
              {data.columns?.map((col) => (
                <TableCell key={col}>
                  {isRowEditing(row) && onEditChange ? (
                    <Input
                      value={String(editingRow[col] ?? '')}
                      onChange={(e) => onEditChange({ ...editingRow, [col]: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    <span className="text-sm">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : (
                        String(row[col])
                      )}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
