'use client';

import { useState } from 'react';
import { Search, Loader2, Globe, Calendar, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setArticles(data.articles);
    } catch (err) {
      setError('Failed to fetch news. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col items-center justify-center space-y-8 mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Discover
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg text-center max-w-2xl">
            Search and explore the latest news and articles from across the web
          </p>
          <form onSubmit={handleSearch} className="w-full max-w-3xl">
            <div className="relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for anything..."
                className="w-full px-8 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-lg group-hover:shadow-xl"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Search className="w-6 h-6" />
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="text-center text-red-500 dark:text-red-400 mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center space-x-4 mb-2">
                    <span className="flex items-center text-white/90 text-sm">
                      <Globe className="w-4 h-4 mr-1" />
                      {article.source}
                    </span>
                    <span className="flex items-center text-white/90 text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                  {article.description}
                </p>
                <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm font-medium">
                  Read more
                  <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {articles.length === 0 && !loading && !error && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">Start your search</p>
            <p className="text-sm mt-2">Enter a topic to discover relevant articles</p>
          </div>
        )}
      </div>
    </div>
  );
} 