// src/components/ui/data-table/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { PostData } from '../../../pages/Dashboard'; // Import the PostData interface
// import badge
import { Badge } from '@/components/ui/badge';

// Custom cell renderers
const renderPostText = (value: string) => {
  // Truncate long text to first 100 characters
  return value && value.length > 100
    ? `${value.substring(0, 100)}...`
    : value;
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

export const columns: ColumnDef<PostData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'post_text',
    header: 'Post Text',
    cell: ({ row }) => renderPostText(row.getValue('post_text')),
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
    accessorKey: 'created_at',
    header: 'Ngày tạo',
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return date ? new Date(date).toLocaleDateString() : '';
    },
  },
  {
    accessorKey: 'price.total_vnd',
    header: 'Giá (VND)',
    cell: ({ row }) => {
      const price = row.original.price?.total_vnd;
      return price ? price.toLocaleString('vi-VN') + ' VND' : 'N/A';
    },
  },
  {
    accessorKey: 'location.city',
    header: 'Thành phố',
    cell: ({ row }) => row.original.location?.city || 'N/A',
  },
  // Add more columns as needed
];