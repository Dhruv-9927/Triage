export default function AvailabilityBadge({ status }: { status: 'available' | 'limited' | 'unavailable' }) {
  const colors = {
    available: 'bg-green-100 text-green-800',
    limited: 'bg-yellow-100 text-yellow-800',
    unavailable: 'bg-red-100 text-red-800'
  };

  const dots = {
    available: 'bg-green-500',
    limited: 'bg-yellow-500',
    unavailable: 'bg-red-500'
  };

  const labels = {
    available: 'Available',
    limited: 'Limited',
    unavailable: 'Unavailable'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dots[status]}`}></span>
      {labels[status]}
    </span>
  );
}
