'use client';

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BookFormData {
  cn_name: string;
  en_name: string;
  author: string;
  cn_douban_link: string;
  en_douban_link: string;
  author_cn_name: string;
  author_wiki_link: string;
}

interface Book extends BookFormData {
  _id: string;
  created_at: string;
}

export default function Home() {
  // Authentication hooks
  const { data: session, status } = useSession();
  const router = useRouter();

  // State hooks
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Book>({
    _id: '',
    cn_name: '',
    en_name: '',
    author: '',
    cn_douban_link: '',
    en_douban_link: '',
    author_cn_name: '',
    author_wiki_link: '',
    created_at: ''
  });
  const [bookForm, setBookForm] = useState<Book>({
    _id: '',
    cn_name: '',
    en_name: '',
    author: '',
    cn_douban_link: '',
    en_douban_link: '',
    author_cn_name: '',
    author_wiki_link: '',
    created_at: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addBookError, setAddBookError] = useState('');
  const [duplicateBooks, setDuplicateBooks] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [totalBooks, setTotalBooks] = useState<number>(0);

  // Authentication effect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Data fetching effect
  useEffect(() => {
    // Fetch total book count only if authenticated
    if (status === 'authenticated') {
      fetchTotalCount();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const fetchTotalCount = async () => {
    try {
      const response = await fetch('/api/count');
      const data = await response.json();
      setTotalBooks(data.count);
    } catch (err) {
      console.error('Failed to fetch total count:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Search failed');

      setSearchResults(data.results);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value.trim()) {
      setHasSearched(false);
      setSearchResults([]);
    }
  };

  const handleAddBook = async (e: React.FormEvent, forceAdd: boolean = false) => {
    e.preventDefault();
    setAddBookError('');
    setDuplicateBooks([]);

    if (!bookForm.cn_name.trim() && !bookForm.en_name.trim()) {
      setAddBookError('Please fill in either Chinese or English name');
      return;
    }

    try {
      const response = await fetch('/api/books/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...bookForm, forceAdd }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setDuplicateBooks(data.duplicates);
        setShowDuplicateModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add book');
      }

      // Reset form and close modals
      setBookForm({
        _id: '',
        cn_name: '',
        en_name: '',
        author: '',
        cn_douban_link: '',
        en_douban_link: '',
        author_cn_name: '',
        author_wiki_link: '',
        created_at: ''
      });
      setShowAddModal(false);
      setShowDuplicateModal(false);
      // Refresh total count
      fetchTotalCount();
    } catch (err) {
      setAddBookError(err instanceof Error ? err.message : 'Failed to add book');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book._id);
    setEditForm({
      _id: book._id || '',
      cn_name: book.cn_name || '',
      en_name: book.en_name || '',
      author: book.author || '',
      cn_douban_link: book.cn_douban_link || '',
      en_douban_link: book.en_douban_link || '',
      author_cn_name: book.author_cn_name || '',
      author_wiki_link: book.author_wiki_link || '',
      created_at: book.created_at || ''
    });
  };


  const handleSaveEdit = async (bookId: string) => {
    if (!editForm.cn_name.trim() && !editForm.en_name.trim()) {
      setError('Either Chinese name or English name is required');
      return;
    }

    try {
      const { _id, ...editFormWithoutId } = editForm;
      const response = await fetch('/api/books/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: _id,
          ...editFormWithoutId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update book');
      }

      // Update the book in the search results
      setSearchResults(prevResults =>
        prevResults.map(book =>
          book._id === bookId
            ? { ...book, ...editFormWithoutId }
            : book
        )
      );

      // Reset editing state
      setEditingBook(null);
      setEditForm({
        _id: '',
        cn_name: '',
        en_name: '',
        author: '',
        cn_douban_link: '',
        en_douban_link: '',
        author_cn_name: '',
        author_wiki_link: '',
        created_at: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book Collection</h1>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-2 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <span className="text-sm font-medium text-white">Total Books:</span>
            <span className="text-lg font-bold text-white">{totalBooks}</span>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-2xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg dark:from-indigo-600 dark:to-purple-700"
        >
          Add New Book
        </button>
      </div>

      <div className="w-full space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search in database..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-400 dark:hover:bg-blue-500"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md dark:bg-red-200 dark:text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {hasSearched ? (
            searchResults.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Search Results:</h3>
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div key={result._id} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-4 border-2 border-gray-200 dark:border-gray-600">
                      {editingBook === result._id ? (
                        <div className="space-y-6">
                          {/* Basic Book Information */}
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-600">
                            <h4 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">Book Information</h4>
                            <div>
                              <label htmlFor="cn_name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Chinese Name
                              </label>
                              <input
                                type="text"
                                id="cn_name"
                                value={editForm.cn_name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, cn_name: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="输入中文书名"
                              />
                            </div>
                            <div>
                              <label htmlFor="en_name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                English Name
                              </label>
                              <input
                                type="text"
                                id="en_name"
                                value={editForm.en_name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, en_name: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter English book name"
                              />
                            </div>
                          </div>

                          {/* Author Information Section */}
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-600">
                            <h4 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">Author Information</h4>
                            <div>
                              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Author Name
                              </label>
                              <input
                                type="text"
                                id="author"
                                value={editForm.author}
                                onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter author's name"
                              />
                            </div>
                            <div>
                              <label htmlFor="author_cn_name" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Author Chinese Name
                              </label>
                              <input
                                type="text"
                                id="author_cn_name"
                                value={editForm.author_cn_name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, author_cn_name: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="输入作者中文名"
                              />
                            </div>
                            <div>
                              <label htmlFor="author_wiki_link" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Author Introduction Link
                              </label>
                              <textarea
                                id="author_wiki_link"
                                value={editForm.author_wiki_link}
                                onChange={(e) => setEditForm(prev => ({ ...prev, author_wiki_link: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out resize-y min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter author introduction link or description..."
                              />
                            </div>
                          </div>

                          {/* Book Links Section */}
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-600">
                            <h4 className="text-lg font-medium text-gray-900 mb-3 dark:text-white">Book Links</h4>
                            <div>
                              <label htmlFor="cn_douban_link" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                Chinese Book Douban Link
                              </label>
                              <input
                                type="url"
                                id="cn_douban_link"
                                value={editForm.cn_douban_link}
                                onChange={(e) => setEditForm(prev => ({ ...prev, cn_douban_link: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="https://book.douban.com/..."
                              />
                            </div>
                            <div>
                              <label htmlFor="en_douban_link" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200">
                                English Book Douban Link
                              </label>
                              <input
                                type="url"
                                id="en_douban_link"
                                value={editForm.en_douban_link}
                                onChange={(e) => setEditForm(prev => ({ ...prev, en_douban_link: e.target.value }))}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="https://book.douban.com/..."
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => setEditingBook(null)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-800 
                              border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 
                              dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-blue-500 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(result._id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 border border-transparent rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="space-y-4 w-full">
                              {/* Book Title */}
                              <div>
                                <h4 className="text-xl font-medium text-blue-600 dark:text-blue-400">
                                  {result.cn_name} / {result.en_name}
                                </h4>
                              </div>

                              {/* Author Information */}
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Author Information</h4>
                                <div className="space-y-1">
                                  <p className="text-gray-800 dark:text-gray-300">
                                    {result.author}
                                    {result.author_cn_name && (
                                      <span className="text-gray-600 dark:text-gray-400 ml-2">({result.author_cn_name})</span>
                                    )}
                                  </p>
                                  {result.author_wiki_link && (
                                    <a
                                      href={result.author_wiki_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                      </svg>
                                      Introduction
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Book Links */}
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => handleEdit(result)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No results found</p>
            )
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Enter a search term to find books
            </div>
          )}
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-2xl leading-6 font-semibold text-gray-900 dark:text-white mb-6">Add New Book</h3>
                <form onSubmit={handleAddBook} className="space-y-6">
                  {/* Basic Book Information */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-sm space-y-4 border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Book Information</h4>

                    {/* Chinese Book Name */}
                    <div>
                      <label htmlFor="add-cn-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chinese Name
                      </label>
                      <input
                        type="text"
                        id="add-cn-name"
                        value={bookForm.cn_name}
                        onChange={(e) => setBookForm(prev => ({ ...prev, cn_name: e.target.value }))}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* English Book Name */}
                    <div>
                      <label htmlFor="add-en-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        English Name
                      </label>
                      <input
                        type="text"
                        id="add-en-name"
                        value={bookForm.en_name}
                        onChange={(e) => setBookForm(prev => ({ ...prev, en_name: e.target.value }))}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Author Information Section */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-sm space-y-4 border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Author Information</h4>

                    {/* Author Name */}
                    <div>
                      <label htmlFor="add-author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        id="add-author"
                        value={bookForm.author}
                        onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Author Introduction */}
                    <div>
                      <label htmlFor="add-author-intro" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Author Introduction
                      </label>
                      <textarea
                        id="add-author-intro"
                        value={bookForm.author_wiki_link}
                        onChange={(e) => setBookForm(prev => ({ ...prev, author_wiki_link: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Book Links Section */}
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-sm space-y-4 border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Book Links</h4>

                    {/* Chinese Book Douban Link */}
                    <div>
                      <label htmlFor="add-cn-douban" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Chinese Book Douban Link
                      </label>
                      <input
                        type="url"
                        id="add-cn-douban"
                        value={bookForm.cn_douban_link}
                        onChange={(e) => setBookForm(prev => ({ ...prev, cn_douban_link: e.target.value }))}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* English Book Douban Link */}
                    <div>
                      <label htmlFor="add-en-douban" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        English Book Douban Link
                      </label>
                      <input
                        type="url"
                        id="add-en-douban"
                        value={bookForm.en_douban_link}
                        onChange={(e) => setBookForm(prev => ({ ...prev, en_douban_link: e.target.value }))}
                        className="mt-1 block w-full rounded-xl shadow-sm border border-gray-300 dark:border-gray-600 
                        py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 
                      bg-blue-600 text-base font-medium text-white hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                      sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200
                      dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Add Book
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-800 
                              border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 
                              dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-blue-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Books Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-gray-600 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-2xl leading-6 font-semibold text-gray-900 dark:text-white mb-6">Similar Books Found</h3>
                <div className="max-h-60 overflow-y-auto mb-4">
                  {duplicateBooks.map((book, index) => (
                    <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl mb-2">
                      {book.cn_name && <p><strong>Chinese Name:</strong> {book.cn_name}</p>}
                      {book.en_name && <p><strong>English Name:</strong> {book.en_name}</p>}
                      {book.author && <p><strong>Author:</strong> {book.author}</p>}
                      {book.cn_douban_link && <p><strong>Chinese Book Douban Link:</strong> <a href={book.cn_douban_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">{book.cn_douban_link}</a></p>}
                      {book.en_douban_link && <p><strong>English Book Douban Link:</strong> <a href={book.en_douban_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">{book.en_douban_link}</a></p>}
                      {book.author_cn_name && <p><strong>Author Chinese Name:</strong> {book.author_cn_name}</p>}
                      {book.author_wiki_link && <p><strong>Author Wikipedia Link:</strong> <a href={book.author_wiki_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">{book.author_wiki_link}</a></p>}
                    </div>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Similar books were found in the database. What would you like to do?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setDuplicateBooks([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-gray-800 
                              border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 
                              dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-blue-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddBook(e, true)}
                    className="px-4 py-2 bg-blue-500 dark:bg-blue-400 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Add Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
