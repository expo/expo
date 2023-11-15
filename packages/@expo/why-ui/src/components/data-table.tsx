import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetroJsonModule } from './data';
import { Link, router } from 'expo-router';

function formatSize(size: number) {
  if (size < 1024) {
    return size + 'B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + 'KB';
  } else {
    return (size / 1024 / 1024).toFixed(1) + 'MB';
  }
}

export function msToTime(ms: number) {
  if (ms <= 0.5) return '<1ms';
  if (ms < 2000) return `${ms}ms`;
  const seconds = +(ms / 1000).toFixed(1);
  if (seconds < 60) return `${seconds}s`;
  const minutes = +(ms / (1000 * 60)).toFixed(1);
  if (minutes < 60) return `${minutes}m`;
  const hours = +(ms / (1000 * 60 * 60)).toFixed(1);
  if (hours < 24) return `${hours}h`;
  const days = +(ms / (1000 * 60 * 60 * 24)).toFixed(1);
  return `${days}d`;
}

export const columns: ColumnDef<MetroJsonModule>[] = [
  {
    accessorKey: 'path',
    header: 'Path',
    enableHiding: false,
    cell: ({ row }) => {
      const type = row.original.output?.[0].type;
      const isVirtual = type === 'js/script/virtual';
      const isEntry = row.original.isEntry;
      return (
        <span className="gap-2 flex">
          <Link
            className="text-slate-50"
            href={{ pathname: '/module/[id]', params: { id: row.original.path } }}>
            {row.getValue('path')}
          </Link>
          {isVirtual && (
            <Badge variant="secondary" className="text-xs">
              Virtual
            </Badge>
          )}
          {isEntry && (
            <Badge variant="default" className="text-xs">
              Entry
            </Badge>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: 'index',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-2 gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        #
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue('index')}</div>;
    },
  },

  {
    accessorKey: 'duration',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-center">{msToTime(row.getValue('duration'))}</div>,
  },
  {
    accessorKey: 'size',

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Size
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-center">{formatSize(row.getValue('size'))}</div>,
  },
  // TODO: Enable but default visibility to hidden
  //   {
  //     accessorKey: 'inverseDependencies',

  //     header: () => <div className="text-right">Dependants</div>,
  //     cell: ({ row }) => {
  //       const amount = row.getValue('inverseDependencies').length;

  //       return <div className="text-right font-medium">{amount}</div>;
  //     },
  //   },
  {
    accessorKey: 'dependencies',
    header: () => <div className="text-right">Deps</div>,
    cell: ({ row }) => {
      const amount = row.getValue('dependencies').length;
      return <div className="text-right font-medium">{amount}</div>;
    },
  },
  {
    id: 'isNodeModule',
    accessorKey: 'isNodeModule',
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              disabled={row.original.output[0].type === 'js/script/virtual'}
              onClick={() => {
                console.log('row.original.path', row.original);
                fetch('/open-stack-frame', {
                  method: 'POST',
                  body: JSON.stringify({
                    file: row.original.absolutePath,
                    lineNumber: 0,
                  }),
                });
              }}>
              Open in Editor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push({ pathname: '/module/[id]', params: { id: row.original.path } });
              }}>
              Inspect module
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTableDemo({ data }: { data: MetroJsonModule[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageState, setPageState] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: Math.min(200, data.length),
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    isNodeModule: false,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPageState,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: pageState.pageIndex,
        pageSize: pageState.pageSize,
      },
    },
  });

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter modules..."
          value={(table.getColumn('path')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('path')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide() && !['isNodeModule'].includes(column.id))
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Filters <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[{ name: 'Node Modules', value: 'isNodeModule' }].map((column) => {
                const tableColumn = table.getColumn(column.value);
                const active = tableColumn?.getFilterValue() !== false;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.value}
                    className="capitalize"
                    checked={active}
                    onCheckedChange={(value) => {
                      tableColumn.setFilterValue(value ? undefined : false);
                    }}>
                    {column.name}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md relative border overflow-auto h-[70vh]">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="overflow-auto h-[400px]">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} modules
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
