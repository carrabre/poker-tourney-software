'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col items-center justify-center">
        <Link href="https://allins.party" target="_blank" rel="noopener noreferrer" className="flex items-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">allins<span className="text-blue-500">.party</span></span>
        </Link>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          The premier platform for poker tournament management
        </p>
      </div>
    </footer>
  );
} 