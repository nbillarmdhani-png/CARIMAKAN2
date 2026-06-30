import { useLocation } from 'react-router-dom';
import { FaGithub, FaTwitter, FaInstagram, FaHeart, FaUtensils } from 'react-icons/fa';

const Footer = () => {
  const location = useLocation();
   if (location.pathname === '/login') {
    return null;
  }
  return (
    <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FaUtensils className="text-2xl text-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">CariMakan</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md">
              Discover delicious recipes from around the world. Find your next favorite meal!
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"><FaGithub size={20} /></a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"><FaTwitter size={20} /></a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"><FaInstagram size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Explore</a></li>
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">About</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Help</a></li>
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-1">
            Made with <FaHeart className="text-red-500 animate-pulse" /> by CariMakan Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;