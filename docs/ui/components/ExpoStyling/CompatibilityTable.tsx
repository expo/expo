import { css } from '@emotion/react';
import { matchSorter } from 'match-sorter';
import { useMemo } from 'react';
import { useTable, useFilters, useGroupBy, useExpanded } from 'react-table';

import { data } from './compatibility';

import { Table, TableHead, HeaderCell, Row, Cell } from '~/ui/components/Table';

const initialExpanded = Object.fromEntries(
  new Map(
    data.flatMap(d => {
      return [
        [`category:${d.category}`, true],
        [`category:${d.category}>subcategory:${d.subcategory}`, true],
      ];
    })
  ).entries()
);

const categoryStyle = css({
  fontWeight: 600,
});

export function CompatibilityTable() {
  const columns = useMemo(
    () => [
      {
        Header: 'Category',
        accessor: 'category',
        filter: 'equals',
        Filter: SelectColumnFilter,
        Cell: ({ value }: any) => {
          return <div css={categoryStyle}>{value}</div>;
        },
      },
      {
        Header: 'Subcategory',
        accessor: 'subcategory',
        filter: 'equals',
        Filter: SelectColumnFilter,
        Cell: ({ value }: any) => {
          return <div css={categoryStyle}>{value}</div>;
        },
      },
      {
        Header: 'Class',
        accessor: 'name',
        Filter: InputColumnFilter,
        filter: fuzzyTextFilterFn,
      },
      {
        Header: 'Native',
        accessor: 'native',
        filter: 'equals',
        Filter: CheckBoxColumnFilter,
        Cell({ value }: any) {
          return value ? '✅' : '❌';
        },
        Aggregated() {
          return <></>;
        },
      },
      {
        Header: 'Web',
        accessor: 'web',
        filter: 'equals',
        Filter: CheckBoxColumnFilter,
        Cell({ value }: any) {
          return value ? '✅' : '❌';
        },
        Aggregated() {
          return <></>;
        },
      },
      {
        Header: 'Notes',
        accessor: 'notes',
        disableFilters: true,
        Cell: ({ value, row }: any) => {
          if (!value) return null;
          return <span {...row.getToggleRowExpandedProps()}>{row.isExpanded ? '👇' : '👉'}</span>;
        },
        Aggregated() {
          return <></>;
        },
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
      initialState: {
        groupBy: ['category', 'subcategory'],
        expanded: initialExpanded,
      },
    } as any,
    useFilters,
    useGroupBy,
    useExpanded
  ) as any;

  return (
    <>
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map((headerGroup: any) => (
            <Row {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <HeaderCell {...column.getHeaderProps()}>
                  {column.render('Header')}
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                </HeaderCell>
              ))}
            </Row>
          ))}
        </TableHead>
        <tbody {...getTableBodyProps()}>
          {rows.flatMap((row: any) => {
            prepareRow(row);
            const rowProps = row.getRowProps();
            return [
              <Row {...rowProps}>
                {row.cells.map((cell: any) => {
                  return (
                    <Cell {...cell.getCellProps()}>
                      {cell.isGrouped ? (
                        <>{cell.render('Cell')}</>
                      ) : cell.isAggregated ? (
                        cell.render('Aggregated')
                      ) : cell.isPlaceholder ? null : (
                        cell.render('Cell')
                      )}
                    </Cell>
                  );
                })}
              </Row>,
              row.isExpanded && row.values.notes ? (
                <Row key={rowProps.key + '_note'}>
                  <Cell colSpan={6}>{renderRowSubComponent({ row })}</Cell>
                </Row>
              ) : null,
            ];
          })}
        </tbody>
      </Table>
      <br />
      <div>Showing the first 100 results of {rows.length} rows</div>
    </>
  );
}

function renderRowSubComponent({ row }: any) {
  return <pre>{row.values.notes}</pre>;
}

function CheckBoxColumnFilter({ column: { filterValue, setFilter } }: any) {
  return (
    <input
      type="checkbox"
      checked={Boolean(filterValue)}
      onChange={e => {
        setFilter(e.target.checked ? true : undefined);
      }}
    />
  );
}

function SelectColumnFilter({ column: { filterValue, setFilter, preFilteredRows, id } }: any) {
  const options = useMemo<string[]>(() => {
    const options = new Set<string>();
    preFilteredRows.forEach((row: any) => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}>
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
function InputColumnFilter({ column: { filterValue, setFilter } }: any) {
  return (
    <>
      Filter:
      <input
        value={filterValue || ''}
        onChange={e => {
          setFilter(e.target.value || undefined);
        }}
        style={{ border: '1px solid gray', marginLeft: '5px' }}
      />
    </>
  );
}

function fuzzyTextFilterFn(rows: any, id: string, filterValue: any) {
  return matchSorter(rows, filterValue, { keys: [(row: any) => row.values[id]] });
}

fuzzyTextFilterFn.autoRemove = (val: any) => !val;
