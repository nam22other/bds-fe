// src/components/ui/data-table/columns.tsx
import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { PostData } from '../../../pages/Dashboard'; // Import the PostData interface
// import badge
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from "@/components/ui/button"

// Custom cell renderers
const renderPostText = (value: string, data: PostData) => {
  // Truncate long text to first 100 characters
  const post = value && value.length > 100
    ? `${value.substring(0, 100)}...`
    : value;

  return (
    <div>
      <p>{post}</p>
      <div>
        {data.special_things?.map((value, index) => <Badge key={index} variant="outline" className="mr-2">{value}</Badge>)}
      </div>
      <a href={data.post_link} target="_blank"
        rel="noopener noreferrer"
        className={
          buttonVariants({ variant: "outline" }) +
          ' mt-3'
        }
      >
        Chi tiết
      </a>
    </div>
  )
};

const renderPropType = (value: string) => {
  // Map property types to more readable formats
  const typeMap: Record<string, string> = {
    'house': 'Nhà',
    'land': 'Đất',
    'rent': 'Cho thuê',
    'hostel': 'Nhà trọ',
    'other': 'Khác'
  };

  return typeMap[value] || value;
};

const renderAreaData = (data: PostData) => {
  const area = data.area;
  if (!area) return 'N/A';

  const parts = [];

  if (area.length_m && area.width_m) {
    parts.push(`${area.width_m}m × ${area.length_m}m`);
  } else {
    if (area.length_m) parts.push(`Dài: ${area.length_m}m`);
    if (area.width_m) parts.push(`Rộng: ${area.width_m}m`);
  }

  if (area.total_m2) {
    parts.push(<div>Tổng: <span className="text-pink-700">{area.total_m2}</span>m²</div>);
  }

  if (area.residential_m2) {
    parts.push(<div>Thổ cư: <span className="text-pink-700">{area.residential_m2}</span>m²</div>);
  }

  if (area.other_land_type) {
    parts.push(<div>Đất khác: {area.other_land_type}</div>);
  }

  return parts.length > 0 ? parts : '-';
};

export const columns: ColumnDef<PostData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 50,
    minSize: 50,
  },
  {
    accessorKey: 'post_text',
    header: 'Post Text',
    cell: ({ row }) => renderPostText(row.getValue('post_text'), row.original),
    enableSorting: false,
    // size: 500, // Set a large size value to make it take up more space
    minSize: 400, // Minimum width in pixels
    maxSize: 1000, // Maximum width in pixels
  },
  {
    accessorKey: 'prop_type',
    header: 'Loại BĐS',
    cell: ({ row }) => {
      const value = row.getValue('prop_type') as string;
      return <Badge variant="secondary">{renderPropType(value)}</Badge>;
    },
  },
  {
    accessorKey: 'price_total_vnd',
    accessorFn: (row) => row.price?.total_vnd, // Use accessorFn instead of accessorKey
    header: 'Giá',
    cell: ({ row }) => {
      const price = row.original.price?.total_vnd;
      return price ? price.toLocaleString('vi-VN') + ' đ' : 'N/A';
    },
    filterFn: 'priceRange' as unknown as FilterFn<PostData>,
  },
  {
    id: 'aggregated_area',
    header: 'Diện tích',
    cell: ({ row }) => renderAreaData(row.original),
    enableSorting: false,
  },
  {
    accessorKey: 'location.road',
    header: 'Đường',
    cell: ({ row }) => row.original.location?.road?.join(', ') || 'N/A',
    enableSorting: false,
  },
  {
    accessorKey: 'location.city',
    header: 'Thành phố',
    cell: ({ row }) => row.original.location?.city || 'N/A',
  },
  {
    accessorKey: 'created_at',
    header: 'Ngày tạo',
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return date ? new Date(date).toLocaleDateString('vi-VN') : '';
    },
  },
  // Add more columns as needed
];