import * as React from "react";
import {
  Table,
  Text,
  Box,
  Spinner,
  Stack,
  Presence,
  Flex,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";

export type DataTableProps<Data extends object> = {
  data: Data[];
  columns: ColumnDef<Data>[];
  initialSort?: SortingState;
  loading?: boolean;
};

export function DataTable<Data extends object>({
  data,
  columns,
  loading,
  initialSort = [],
}: DataTableProps<Data>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSort);
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Box position="relative">
      <Presence present={loading} unmountOnExit>
        <Stack
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          bg="rgba(0,0,0,0.3)"
          padding={10}
          alignItems="center"
          borderRadius={10}
          gap={4}
        >
          <Text fontSize="xl">Loading outfits, candies and prices</Text>
          <Spinner />
        </Stack>
      </Presence>
      <Table.Root>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.ColumnHeader
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <Flex>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === "desc" ? (
                        <ChevronDown aria-label="sorted descending" />
                      ) : (
                        <ChevronUp aria-label="sorted ascending" />
                      )
                    ) : null}
                  </Flex>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta;
                return (
                  <Table.Cell
                    key={cell.id}
                    textAlign={meta?.isNumeric ? "end" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
