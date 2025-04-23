// src/components/ui/data-table/columns.tsx
import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { PostData } from '../../../pages/Dashboard'; // Import the PostData interface
// import badge
import { Badge } from '@/components/ui/badge';

// Custom cell renderers
const renderPostText = (value: string, data: PostData) => {
  // Truncate long text to first 100 characters
  const post = value && value.length > 150
    ? `${value.substring(0, 150)}...`
    : value;

  return (
    <div>
      <p>{post}</p>
      <div className="hidden lg:block mt-3">
        {data.special_things?.map((value, index) => <Badge key={index} variant="outline" className="mr-2">{value}</Badge>)}
      </div>
      {data.reaction && (
        <div className="mt-3">
          {data.reaction.dislike && (
            <Badge variant="outline" className="mr-2 border-red-500">
              👎 <span className="strong">{data.reaction.dislike}</span>
            </Badge>

          )}
        </div>
      )}
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
    parts.push(<div key="dt">{area.width_m}m × {area.length_m}m</div>);
  } else {
    if (area.length_m) parts.push(<div key="length">Dài: {area.length_m}m</div>);
    if (area.width_m) parts.push(<div key="rong">Rộng: {area.width_m}m</div>);
  }

  if (area.total_m2) {
    parts.push(<div key="dtm2">Tổng: <span className="text-pink-700">{area.total_m2}</span>m²</div>);
  }

  if (area.residential_m2) {
    parts.push(<div key="tc">Thổ cư: <span className="text-pink-700">{area.residential_m2}</span>m²</div>);
  }

  if (area.other_land_type) {
    parts.push(<div key="dk">Đất khác: {area.other_land_type}</div>);
  }

  return parts.length > 0 ? parts : '-';
};

function formatVietnameseNumber(number: number | undefined | null) {
  if (number === null || number === undefined) return '0';

  const ty = Math.floor(number / 1_000_000_000);
  const trieu = Math.floor((number % 1_000_000_000) / 1_000_000);
  const nghin = Math.floor((number % 1_000_000) / 1_000);

  let result = '';
  if (ty > 0) result += `${ty} tỷ`;
  if (trieu > 0) result += (result ? ' ' : '') + `${trieu} triệu`;
  if (ty <= 0 && nghin > 0) result += (result ? ' ' : '') + `${nghin} nghìn`;

  return result || '0';
}

const renderPriceData = (data: PostData) => {
  const price = data.price;
  if (!price) return 'N/A';

  const parts = [];

  if (price.total_vnd) {
    parts.push(<div key="totalPrice" title={`Giá ${price.total_vnd?.toLocaleString('vi-VN')}`}>{formatVietnameseNumber(price.total_vnd)}</div>);
  }

  if (price.residential_unit_price_per_m2) {
    parts.push(<div key="dgtc" title={`Đơn giá Thổ cư: ${price.residential_unit_price_per_m2?.toLocaleString('vi-VN')} đ`}>ĐGTC: <span className="text-pink-700">{formatVietnameseNumber(price.residential_unit_price_per_m2)}</span></div>);
  }

  if (price.total_unit_price_per_m2) {
    parts.push(<div key="dgm2" title={`Đơn giá M2: ${price.total_unit_price_per_m2?.toLocaleString('vi-VN')} đ`}>ĐG: <span className="text-pink-700">{formatVietnameseNumber(price.total_unit_price_per_m2)}</span></div>);
  }

  return parts.length > 0 ? parts : '-';
};

export const columns: ColumnDef<PostData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: {
      width: '20px'
    },
    cell: ({ row }) => {
      return (
        <a href={row.original.post_link}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
          title="Mở Link bài viết gốc"
        >
          {row.getValue('id')}
        </a>
      )
    }
  },
  {
    accessorKey: 'post_text',
    header: 'Bài Viết',
    cell: ({ row }) => renderPostText(row.getValue('post_text'), row.original),
    enableSorting: false,
    minSize: 250, // Minimum width in pixels
    meta: {
      width: '40%'
    },
  },
  {
    accessorKey: 'prop_type',
    header: 'Loại BĐS',
    cell: ({ row }) => {
      const value = row.getValue('prop_type') as string;
      return <Badge variant="secondary">{renderPropType(value)}</Badge>;
    },
    filterFn: 'propTypeFilter' as unknown as FilterFn<PostData>,
  },
  {
    accessorKey: 'price_total_vnd',
    accessorFn: (row) => row.price?.total_vnd, // Use accessorFn instead of accessorKey
    header: 'Giá',
    cell: ({ row }) => renderPriceData(row.original),
    filterFn: 'priceRange' as unknown as FilterFn<PostData>,
    minSize: 150, // Minimum width in pixels
    meta: {
      width: '10%'
    },
  },
  {
    id: 'aggregated_area',
    header: 'Diện tích',
    cell: ({ row }) => renderAreaData(row.original),
    enableSorting: false,
    minSize: 100, // Minimum width in pixels
    meta: {
      width: '10%'
    },
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