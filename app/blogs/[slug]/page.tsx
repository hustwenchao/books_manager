import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import matter from 'gray-matter';
import type { MDXComponents } from 'mdx/types';

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-semibold mb-4 mt-8 text-gray-800 dark:text-gray-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800 dark:text-gray-100">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 ml-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-700 dark:text-gray-300">{children}</li>
  ),
};

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'content/blogs');
  const files = fs.readdirSync(postsDirectory);
  
  return files.map((filename) => ({
    slug: filename.replace(/\.mdx$/, ''),
  }));
}

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getBlogPost(slug: string) {
  const filePath = path.join(process.cwd(), 'content/blogs', `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContent);
  return { content, data };
}

export default async function BlogPost({ params }: BlogPostProps) {
  // Wait for params to resolve
  const resolvedParams = await params;
  const { content, data } = await getBlogPost(resolvedParams.slug);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {data.title}
          </h1>
          <div className="flex items-center space-x-4">
            <time className="text-gray-500 dark:text-gray-400" dateTime={data.date}>
              {data.date}
            </time>
            {data.author && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500 dark:text-gray-400">{data.author}</span>
              </>
            )}
            {data.readingTime && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500 dark:text-gray-400">{data.readingTime} min read</span>
              </>
            )}
          </div>
        </header>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRemote 
            source={content} 
            components={components}
          />
        </div>
      </div>
    </article>
  );
}
