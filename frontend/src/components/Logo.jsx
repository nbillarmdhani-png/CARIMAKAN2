import { FaUtensils } from 'react-icons/fa';

const Logo = ({ size = 'text-3xl', showText = true }) => {
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative">
        <div className={`${size} text-pink-500 dark:text-pink-400 group-hover:rotate-12 transition-transform duration-300`}>
          <FaUtensils />
        </div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse" />
      </div>
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          CariMakan
        </span>
      )}
    </div>
  );
};

export default Logo;