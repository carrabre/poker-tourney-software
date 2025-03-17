'use client';

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Footer from '@/app/components/Footer';

export default function Home() {
  const [hoverDemo, setHoverDemo] = useState(false);
  const [hoverCreate, setHoverCreate] = useState(false);

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-black text-gray-900 dark:text-white transition-colors duration-500">
      {/* Background gradient circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[300px] -left-[300px] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/20 to-blue-200/10 dark:from-blue-900/20 dark:to-blue-800/5 blur-xl"></div>
        <div className="absolute top-[60%] -right-[300px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-100/10 to-purple-200/5 dark:from-purple-900/10 dark:to-purple-800/5 blur-xl"></div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-16 md:py-24 lg:py-32 relative">
        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Allins
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl font-light leading-relaxed">
            Beautiful, intuitive tournament management for the modern poker director
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
            <motion.div 
              className="relative flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoverCreate(true)}
              onHoverEnd={() => setHoverCreate(false)}
            >
              <Link 
                href="/tournament/new" 
                className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-2xl text-lg font-medium shadow-lg shadow-blue-500/20 transition-all duration-300 h-14"
              >
                <span className="mr-2">Create Tournament</span>
                <motion.span 
                  animate={{ x: hoverCreate ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >→</motion.span>
              </Link>
            </motion.div>
            
            <motion.div 
              className="relative flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoverDemo(true)}
              onHoverEnd={() => setHoverDemo(false)}
            >
              <Link 
                href="/tournament/view?id=demo" 
                className="flex items-center justify-center w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-4 px-8 rounded-2xl text-lg font-medium border border-gray-200 dark:border-gray-800 shadow-lg shadow-gray-100/20 dark:shadow-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 h-14"
              >
                <span className="mr-2">View Demo</span>
                <motion.span 
                  animate={{ x: hoverDemo ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >→</motion.span>
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-32 text-center opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Designed for professional tournament directors and poker rooms
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </main>
  );
}
