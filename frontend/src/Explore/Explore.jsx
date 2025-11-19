
import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import SearchMenu from './SearchMenu';

const trendingTopics = [
  { tag: '#Photography', posts: '12.4k' },
  { tag: '#Design', posts: '8.9k' },
  { tag: '#Innovation', posts: '6.2k' },
  { tag: '#Lifestyle', posts: '5.7k' },
  { tag: '#Wellness', posts: '4.3k' },
];

const exploreCards = [
  {
    title: 'Nature',
    img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    posts: '2.4k',
  },
  {
    title: 'Architecture',
    img: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2',
    posts: '1.8k',
  },
  {
    title: 'Technology',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    posts: '3.2k',
  },
  {
    title: 'Travel',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    posts: '4.1k',
  },
  {
    title: 'Food',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    posts: '2.9k',
  },
  {
    title: 'Art',
    img: 'https://images.unsplash.com/photo-1456086272160-b28b0645b729',
    posts: '1.5k',
  },
];

function ExploreGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
      {exploreCards.map((category, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 z-10" />
          <img
            src={category.img}
            alt={category.title}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h3 className="text-white text-xl font-semibold mb-2">{category.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{category.posts} posts</span>
              <ExternalLink className="text-white w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Explore() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useDebouncedCallback(async (value) => {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/search?query=${encodeURIComponent(value)}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setSearchResults([]);
      setLoading(false);
    }
  }, 200);

  useEffect(() => {
    document.title = "Search - Gatherly";
  }, []);

  const handleSelectUser = (username) => {
    setQuery('');
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-900">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Discover Amazing Content</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">
          Explore thousands of high-quality resources, articles, and inspirations curated just for you.
        </p>
      </div>


      <div className="max-w-xl mx-auto relative mb-6">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for users..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        {/* Search dropdown */}
        {!loading && query && searchResults.length === 0 && (
          <div className="text-center mt-2 pt-3 text-indigo-800 text-m font-medium dark:text-indigo-300">No User Found !!</div>
        )}
        {searchResults.length > 0 && !loading && (
          <div className="absolute bg-white border rounded-lg shadow-md w-full mt-2 z-10 dark:bg-gray-800 dark:border-gray-700">
            <SearchMenu users={searchResults} onSelect={handleSelectUser} />
          </div>
        )}
      </div>

      {/* Trending topics */}
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-sm mb-10 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Trending Topics</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {trendingTopics.map((topic) => (
            <div key={topic.tag} className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-700 font-medium cursor-pointer dark:bg-gray-700 dark:text-gray-100">
              {topic.tag} <span className="text-gray-500 ml-1">{topic.posts} posts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explore cards grid */}
      <ExploreGrid />
    </div>
  );
}

export default Explore;
