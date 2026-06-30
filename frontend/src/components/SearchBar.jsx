import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for delicious meals..."
          className="w-full px-6 py-4 pl-14 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 focus:border-primary-400 focus:outline-none shadow-lg hover:shadow-xl transition-all duration-300 text-gray-800 placeholder-gray-400"
        />
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-hover:text-primary-500 transition-colors" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
};

export default SearchBar;