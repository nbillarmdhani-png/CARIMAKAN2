const SkeletonDetail = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      
      {/* Main card skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Image skeleton */}
        <div className="h-72 md:h-96 bg-gray-300 dark:bg-gray-700"></div>
        
        {/* Content skeleton */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Rating & Time skeleton */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          
          {/* Restaurant skeleton */}
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          
          {/* Price skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl">
            <div>
              <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded mt-1"></div>
            </div>
            <div className="h-12 w-48 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
          </div>
          
          {/* Description skeleton */}
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          {/* Ingredients skeleton */}
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
          
          {/* Instructions skeleton */}
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonDetail;