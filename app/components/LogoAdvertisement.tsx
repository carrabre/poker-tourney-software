'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const LogoAdvertisement = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 transition-all duration-500 ease-in-out
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                 ${isHovered ? 'scale-110' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        href="https://eth.cash" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block relative"
      >
        <div className="relative flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg rounded-full
                          animate-glowPulse hover:animate-none transition-all duration-300 overflow-hidden">
            <Image
              src="/images/ethcash.png"
              alt="EthCash Logo"
              width={75}
              height={75}
              className="object-contain"
            />
          </div>

          <div className={`ml-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg transition-all duration-300 
                         flex items-center whitespace-nowrap
                         ${isHovered ? 'opacity-100 max-w-44 ml-2' : 'opacity-0 max-w-0 ml-0 overflow-hidden'}`}>
            <div>
              <div className="font-bold text-sm">eth.cash</div>
              <div className="text-xs text-gray-300">Borderless payments</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
