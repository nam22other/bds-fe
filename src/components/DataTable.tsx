// src/components/DataTable.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
  FilterFn,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'; // Import sorting icons
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { X, Filter } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterColumn?: string; // Optional filter column name
}

// Custom filter function for price range
const priceRangeFilterFn: FilterFn<{ price?: { total_vnd: number | null } }> = (row, columnId, filterValue) => {
  const { min, max, excludeNull } = filterValue;
  const price = row.original.price?.total_vnd;

  // If price is null and we're excluding nulls
  if (price === null && excludeNull) {
    return false;
  }

  // If price is null and we're not excluding nulls
  if (price === null || price === undefined) {
    return true;
  }

  // Check min value if provided
  if (min !== null && min !== undefined && min !== '' && price < min) {
    return false;
  }

  // Check max value if provided
  if (max !== null && max !== undefined && max !== '' && price > max) {
    return false;
  }

  return true;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  // filterColumn = 'post_text', // Default to post_text for filtering
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'id', desc: true },
  ]); // Add sorting state

  // Price filter state
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [excludeNullPrices, setExcludeNullPrices] = useState<boolean>(false);
  const [priceFilterError, setPriceFilterError] = useState<string | null>(null);
  const [isPriceFilterActive, setIsPriceFilterActive] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  // Add this state for multi-sort mode
  const [isMultiSortMode, setIsMultiSortMode] = useState<boolean>(true);

  // Register the custom filter
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(), // Add sorting model
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting, // Add sorting change handler
    state: {
      columnFilters,
      sorting, // Add sorting to state
    },
    filterFns: {
      priceRange: priceRangeFilterFn,
    },
    columnResizeMode: "onChange", // Enable column resizing
    enableMultiSort: true,
    maxMultiSortColCount: 3,
    isMultiSortEvent: () => isMultiSortMode,
    defaultColumn: {
      meta: {
        width: '50px'
      }
    }
  });

  // Apply price filter when values change
  const applyPriceFilter = () => {
    // Validate price range
    if (priceMin && priceMax && Number(priceMin) > Number(priceMax)) {
      setPriceFilterError('Min price must be less than max price');
      return;
    } else {
      setPriceFilterError(null);
    }

    // Apply filter - convert millions to actual VND by multiplying by 1,000,000
    table.getColumn('price_total_vnd')?.setFilterValue({
      min: priceMin ? Number(priceMin) * 1000000 : null,
      max: priceMax ? Number(priceMax) * 1000000 : null,
      excludeNull: excludeNullPrices,
    });

    // Set filter as active if any value is set
    const isActive = !!(priceMin || priceMax || excludeNullPrices);
    setIsPriceFilterActive(isActive);
    setIsPopoverOpen(false);
  };

  // Reset price filter
  const resetPriceFilter = () => {
    setPriceMin('');
    setPriceMax('');
    setExcludeNullPrices(false);
    setPriceFilterError(null);
    table.getColumn('price_total_vnd')?.setFilterValue(undefined);
    setIsPriceFilterActive(false);
    setIsPopoverOpen(false);
  };

  return (
    <div>
      <div className="flex gap-4 py-4">
        <div className="flex items-center">
          <Input
            placeholder="Filter records..."
            value={(table.getColumn('post_text')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('post_text')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        {/* Price range filter */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={isPriceFilterActive ? "default" : "outline"}
              size="sm"
              className={
                "flex items-center gap-1 " +
                (isPriceFilterActive ? "bg-pink-700" : "")
              }
            >
              <Filter className="h-4 w-4" />
              Giá
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h3 className="font-medium">Price Filter</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="price-min">Min (Triệu VND)</Label>
                  <Input
                    id="price-min"
                    type="number"
                    placeholder="Triệu đồng"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyPriceFilter();
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="price-max">Max (Triệu VND)</Label>
                  <Input
                    id="price-max"
                    type="number"
                    placeholder="Triệu đồng"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyPriceFilter();
                      }
                    }}
                  />
                </div>
              </div>

              {priceFilterError && (
                <p className="text-sm text-red-500">{priceFilterError}</p>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclude-null"
                  checked={excludeNullPrices}
                  onCheckedChange={(checked) =>
                    setExcludeNullPrices(checked === true)
                  }
                />
                <Label htmlFor="exclude-null">Lọc bài không có giá</Label>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPriceFilter}
                  className="flex items-center"
                >
                  <X className="mr-1 h-4 w-4" />
                  Reset
                </Button>
                <Button size="sm" onClick={applyPriceFilter}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <div className="text-xs text-gray-500 p-2 flex justify-between items-center">
          <span>
            {isMultiSortMode
              ? "Chế độ sắp xếp Nhiều Cột (Max 3 cột)"
              : "Chế độ sắp xếp 1 Cột"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMultiSortMode(!isMultiSortMode)}
            className="text-xs h-7"
          >
            {isMultiSortMode ? "Tắt sắp xếp nhiều cột" : "Bật sắp xếp nhiều cột"}
          </Button>
        </div>
        <Table className="w-full lg:table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}
                    style={{
                      width: (header.column.columnDef.meta as { width?: string })?.width ||
                        (header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto'),
                      minWidth: header.column.columnDef.minSize ? `${header.column.columnDef.minSize}px` : '80px',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center cursor-pointer select-none"
                            : ""
                        }
                        onClick={(e) => {
                          const handler = header.column.getToggleSortingHandler();
                          if (!handler) return;

                          handler(e);
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-2">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}