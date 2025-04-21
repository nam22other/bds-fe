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
  const { signOut } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select()
        // .order('id', { ascending: false })
        // where status is 1
        .eq('status', 1)
        ;

      if (error) throw error;
      setData(data as PostData[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}