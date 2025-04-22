// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataTable } from '../components/DataTable';
import { columns } from '../components/ui/data-table/columns';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

interface PostPrice {
  total_vnd: number | null; // total price in VND and null if not available in the post
  total_text: string | null; // total price in text format and null if not available in the post
  total_unit_price_per_m2: number | null; // unit price per m2 in VND and null if not available in the post
  residential_unit_price_per_m2: number | null; // residential unit price per m2 in VND and null if not available in the post
  negotiable: boolean | null; // whether the price is negotiable or not and null if not available in the post
}
interface PostArea {
  length_m: number | null; // length in meters and null if not available in the post
  width_m: number | null; // width in meters and null if not available in the post
  total_m2: number | null; // total area in square meters and null if not available in the post
  residential_m2: number | null; // residential area in square meters and null if not available in the post
  other_land_type: string | null; // other land type and null if not available in the post
}
interface PostLocation {
  city: string | null; // city and null if not available in the post
  district: string | null; // district and null if not available in the post
  road: string[] | null; // road names in string and null if not available in the post
  near_road: boolean | null; // whether the property is near the road or not and null if not available in the post
  maps_link: string | null; // link to the maps and null if not available in the post
  proximity: string[] | null
}
export interface PostData {
  id: number;
  author_id: string;
  author_name: string;
  post_id: string;
  post_text: string; // the raw post text without any formatting & structure, which is still in natural language
  post_link: string; // the link to the original post
  prop_type: 'house' | 'land' | 'rent' | 'hostel' | 'other';
  other_payload: null | [];
  pink_book: string | null;
  price: PostPrice | null;
  area: PostArea | null;
  location: PostLocation | null;
  status: number;
  fetch_at: string | null;
  special_things: string[] | null,
  created_at: string; // create time of this real estate post
}

export function Dashboard() {
  const [data, setData] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { signOut } = useAuth();

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // sorting state
  const [sorting, setSorting] = useState<{
    id: string;
    desc: boolean;
  }[]>([{ id: 'id', desc: true }]);

  // Filter state
  const [filters, setFilters] = useState<{
    post_text?: string;
    prop_type?: string[];
    price_min?: number;
    price_max?: number;
    exclude_null_prices?: boolean;
    sorting?: { id: string; desc: boolean }[];
  }>({
    sorting: [{ id: 'id', desc: true }]
  });

  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Start building the query
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('status', 1);

      // Apply text filter
      if (filters.post_text) {
        query = query.ilike('post_text', `%${filters.post_text}%`);
      }

      // Apply property type filter
      if (filters.prop_type && filters.prop_type.length > 0) {
        query = query.in('prop_type', filters.prop_type);
      }

      // Apply price filters
      if (filters.price_min || filters.price_max || filters.exclude_null_prices) {
        // Handle price min
        if (filters.price_min) {
          query = query.gte('total_vnd_int', filters.price_min);
        }

        // Handle price max
        if (filters.price_max) {
          query = query.lte('total_vnd_int', filters.price_max);
        }

        // Handle null prices
        if (filters.exclude_null_prices) {
          query = query.not('total_vnd_int', 'is', null);
        }
      }

      // Apply pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;

      // Apply sorting
      if (filters.sorting && filters.sorting.length > 0) {
        // Apply each sort in order
        filters.sorting.forEach(sort => {
          // Handle special cases for nested JSON fields
          if (sort.id === 'price_total_vnd') {
            query = query.order('total_vnd_int', { ascending: !sort.desc, nullsFirst: false });
          } else if (sort.id.includes('.')) {
            // Handle nested fields like location.city
            const [parent, child] = sort.id.split('.');
            query = query.order(`${parent}->>${child}`, { ascending: !sort.desc, nullsFirst: false });
          } else {
            // Regular fields
            query = query.order(sort.id, { ascending: !sort.desc, nullsFirst: false });
          }
        });
      } else {
        // Default sorting
        query = query.order('id', { ascending: false });
      }

      // Execute the query with pagination
      const { data, error, count } = await query
        .range(from, to)
        .order('id', { ascending: false });


      if (error) throw error;

      setData(data as PostData[] || []);
      if (count !== null) setTotalCount(count);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPageIndex(0); // Reset to first page when filters change
  };

  // Handler for pagination changes
  const handlePaginationChange = (newPageIndex: number, newPageSize: number) => {
    setPageIndex(newPageIndex);
    setPageSize(newPageSize);
  };


  // handler for sorting changes
  const handleSortingChange = (newSorting: { id: string; desc: boolean }[]) => {
    setSorting(newSorting);
    setFilters(prev => ({
      ...prev,
      sorting: newSorting
    }));
    setPageIndex(0); // Reset to first page when sorting changes
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
      {loading && data.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pageCount={Math.ceil(totalCount / pageSize)}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
          onFilterChange={handleFilterChange}
          onSortingChange={handleSortingChange}
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
        />
      )}
    </div>
  );
}