import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

function getBlogPosts(): BlogPost[] {
  const postsDirectory = path.join(process.cwd(), 'content/blogs');
  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
      };
    })
    .sort((a, b) => (new Date(b.date) as any) - (new Date(a.date) as any));

  return posts;
}

export default function BlogsPage() {
  const posts = getBlogPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
        Blog Posts
      </h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <article 
            key={post.slug} 
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all duration-200"
          >
            <Link href={`/blogs/${post.slug}`} className="block p-6 group">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                  {post.title}
                </h2>
                <time 
                  className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4"
                  dateTime={post.date}
                >
                  {post.date}
                </time>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 font-medium transition-colors duration-200">
                <span>Read more</span>
                <svg 
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
