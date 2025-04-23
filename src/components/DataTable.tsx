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
import { useState, useEffect, useRef } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { CheckSquare } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  onFilterChange?: (filters: object) => void;
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;
  sorting?: SortingState;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
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
  pageCount = 0,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  onFilterChange,
  onSortingChange,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
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

  // Property type filter state
  const [propTypeFilters, setPropTypeFilters] = useState<string[]>([]);
  const [isPropTypeFilterActive, setIsPropTypeFilterActive] = useState<boolean>(false);

  const [internalSorting, setInternalSorting] = useState<SortingState>([
    { id: 'id', desc: true },
  ]);

  // Use the provided sorting if available
  const activeSorting = sorting || internalSorting;

  const handlePropTypeFilter = (value: string) => {
    setPropTypeFilters(current => {
      // If already selected, remove it
      if (current.includes(value)) {
        const newFilters = current.filter(item => item !== value);
        // Update filter active state
        setIsPropTypeFilterActive(newFilters.length > 0);
        return newFilters;
      }
      // Otherwise add it
      const newFilters = [...current, value];
      setIsPropTypeFilterActive(true);
      return newFilters;
    });
  };



  // Register the custom filter
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function'
          ? updater(activeSorting)
          : updater;

      // Update both internal states
      setSorting(newSorting);
      setInternalSorting(newSorting);

      if (manualSorting && onSortingChange) {
        onSortingChange(newSorting);
      }
    },
    manualPagination,
    manualFiltering,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      columnFilters,
      sorting: activeSorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: manualPagination && onPaginationChange
      ? (updater) => {
        const newPagination =
          typeof updater === 'function'
            ? updater({ pageIndex, pageSize })
            : updater;
        onPaginationChange(newPagination.pageIndex, newPagination.pageSize);
      }
      : undefined,
    filterFns: {
      priceRange: priceRangeFilterFn,
      propTypeFilter: (row, columnId, filterValue) => {
        const propType = row.getValue(columnId) as string;
        const filters = filterValue as string[];
        return filters.length === 0 || filters.includes(propType);
      },
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


  // Use a ref to track if this is the initial render
  const isInitialRender = useRef(true);
  const previousFilters = useRef({
    post_text: undefined as string | undefined,
    prop_type: [] as string[],
    price_min: undefined as number | undefined,
    price_max: undefined as number | undefined,
    exclude_null_prices: false
  });

  // Debounce filter changes
  useEffect(() => {
    // Skip the initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Get current filter values
    const currentFilters = {
      post_text: table.getColumn('post_text')?.getFilterValue() as string,
      prop_type: propTypeFilters,
      price_min: priceMin ? Number(priceMin) * 1000000 : undefined,
      price_max: priceMax ? Number(priceMax) * 1000000 : undefined,
      exclude_null_prices: excludeNullPrices,
    };

    // Check if filters have actually changed
    const hasChanged =
      currentFilters.post_text !== previousFilters.current.post_text ||
      JSON.stringify(currentFilters.prop_type) !== JSON.stringify(previousFilters.current.prop_type) ||
      currentFilters.price_min !== previousFilters.current.price_min ||
      currentFilters.price_max !== previousFilters.current.price_max ||
      currentFilters.exclude_null_prices !== previousFilters.current.exclude_null_prices;

    if (manualFiltering && onFilterChange && hasChanged) {

      console.log(currentFilters)
      console.log(previousFilters.current)
      const timer = setTimeout(() => {
        onFilterChange(currentFilters);
        // Update previous filters after applying
        previousFilters.current = currentFilters;
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    manualFiltering,
    onFilterChange,
    propTypeFilters,
    table,
    table.getColumn('post_text')?.getFilterValue() as string,
    JSON.stringify(propTypeFilters),
    priceMin,
    priceMax,
    excludeNullPrices
  ]);

  useEffect(() => {
    const column = table.getColumn('prop_type');
    if (column) {
      if (propTypeFilters.length > 0) {
        column.setFilterValue(propTypeFilters);
      } else {
        column.setFilterValue(undefined);
      }
    }
  }, [propTypeFilters, table]);

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

        {/* Property Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isPropTypeFilterActive ? "default" : "outline"}
              size="sm"
              className={
                "flex items-center gap-1 " +
                (isPropTypeFilterActive ? "bg-pink-700" : "")
              }
            >
              <CheckSquare className="h-4 w-4" />
              Loại BĐS
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={propTypeFilters.includes('house')}
              onCheckedChange={() => handlePropTypeFilter('house')}
            >
              Nhà
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={propTypeFilters.includes('land')}
              onCheckedChange={() => handlePropTypeFilter('land')}
            >
              Đất
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={propTypeFilters.includes('rent')}
              onCheckedChange={() => handlePropTypeFilter('rent')}
            >
              Cho thuê
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={propTypeFilters.includes('hostel')}
              onCheckedChange={() => handlePropTypeFilter('hostel')}
            >
              Nhà trọ
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={propTypeFilters.includes('other')}
              onCheckedChange={() => handlePropTypeFilter('other')}
            >
              Khác
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

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

                          // Just call the handler - the onSortingChange above will handle the rest
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newPageSize = Number(e.target.value);
              if (manualPagination && onPaginationChange) {
                onPaginationChange(pageIndex, newPageSize);
              } else {
                table.setPageSize(newPageSize);
              }
            }}
            className="border rounded p-1 text-sm"
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPaginationChange) {
                onPaginationChange(pageIndex - 1, pageSize);
              } else {
                table.previousPage();
              }
            }}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPaginationChange) {
                onPaginationChange(pageIndex + 1, pageSize);
              } else {
                table.nextPage();
              }
            }}
            disabled={pageIndex >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}