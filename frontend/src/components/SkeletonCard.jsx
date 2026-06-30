const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-2.5 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="flex gap-1.5 mt-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;