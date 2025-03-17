'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Footer from '@/app/components/Footer';

// Template type definition
interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  buyIn: number;
  entryFee: number;
  startingChips: number;
  blindLevels: Array<{ small: number; big: number; ante: number }>;
  levelDurationMinutes: number;
  breakInterval: number;
  breakDurationMinutes: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Predefined tournament templates
  const templates: TournamentTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Tournament',
      description: 'A balanced structure for home games with 3-4 hour duration',
      buyIn: 50,
      entryFee: 5,
      startingChips: 5000,
      blindLevels: [
        { small: 25, big: 50, ante: 0 },
        { small: 50, big: 100, ante: 0 },
        { small: 75, big: 150, ante: 0 },
        { small: 100, big: 200, ante: 25 },
        { small: 150, big: 300, ante: 25 },
        { small: 200, big: 400, ante: 50 },
        { small: 250, big: 500, ante: 50 },
        { small: 300, big: 600, ante: 75 },
        { small: 400, big: 800, ante: 100 },
        { small: 500, big: 1000, ante: 100 },
        { small: 600, big: 1200, ante: 200 },
        { small: 800, big: 1600, ante: 200 },
        { small: 1000, big: 2000, ante: 300 },
        { small: 1500, big: 3000, ante: 400 },
        { small: 2000, big: 4000, ante: 500 },
      ],
      levelDurationMinutes: 15,
      breakInterval: 4,
      breakDurationMinutes: 10,
    },
    {
      id: 'quick',
      name: 'Quick Tournament',
      description: 'Fast-paced structure for 1-2 hour games',
      buyIn: 25,
      entryFee: 5,
      startingChips: 3000,
      blindLevels: [
        { small: 25, big: 50, ante: 0 },
        { small: 50, big: 100, ante: 0 },
        { small: 75, big: 150, ante: 25 },
        { small: 100, big: 200, ante: 25 },
        { small: 150, big: 300, ante: 50 },
        { small: 200, big: 400, ante: 50 },
        { small: 300, big: 600, ante: 75 },
        { small: 400, big: 800, ante: 100 },
        { small: 500, big: 1000, ante: 200 },
        { small: 700, big: 1400, ante: 300 },
        { small: 1000, big: 2000, ante: 400 },
      ],
      levelDurationMinutes: 10,
      breakInterval: 5,
      breakDurationMinutes: 5,
    },
    {
      id: 'casino',
      name: 'Casino Style',
      description: 'Deep structure similar to casino events, 5-6 hour duration',
      buyIn: 100,
      entryFee: 20,
      startingChips: 10000,
      blindLevels: [
        { small: 25, big: 50, ante: 0 },
        { small: 50, big: 100, ante: 0 },
        { small: 75, big: 150, ante: 0 },
        { small: 100, big: 200, ante: 25 },
        { small: 150, big: 300, ante: 25 },
        { small: 200, big: 400, ante: 50 },
        { small: 250, big: 500, ante: 50 },
        { small: 300, big: 600, ante: 75 },
        { small: 400, big: 800, ante: 100 },
        { small: 500, big: 1000, ante: 100 },
        { small: 600, big: 1200, ante: 200 },
        { small: 800, big: 1600, ante: 200 },
        { small: 1000, big: 2000, ante: 300 },
        { small: 1500, big: 3000, ante: 400 },
        { small: 2000, big: 4000, ante: 500 },
        { small: 2500, big: 5000, ante: 500 },
        { small: 3000, big: 6000, ante: 1000 },
        { small: 4000, big: 8000, ante: 1000 },
        { small: 5000, big: 10000, ante: 1000 },
        { small: 6000, big: 12000, ante: 2000 },
      ],
      levelDurationMinutes: 20,
      breakInterval: 4,
      breakDurationMinutes: 15,
    },
    {
      id: 'turbo',
      name: 'Turbo Tournament',
      description: 'Very fast structure for quick games under 1 hour',
      buyIn: 20,
      entryFee: 0,
      startingChips: 2000,
      blindLevels: [
        { small: 25, big: 50, ante: 0 },
        { small: 50, big: 100, ante: 25 },
        { small: 100, big: 200, ante: 25 },
        { small: 150, big: 300, ante: 50 },
        { small: 200, big: 400, ante: 50 },
        { small: 300, big: 600, ante: 100 },
        { small: 400, big: 800, ante: 200 },
        { small: 600, big: 1200, ante: 300 },
        { small: 800, big: 1600, ante: 400 },
      ],
      levelDurationMinutes: 6,
      breakInterval: 6,
      breakDurationMinutes: 3,
    },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // Encode the template data as URL parameters
    const params = new URLSearchParams({
      template: template.id,
      name: template.name,
      buyIn: template.buyIn.toString(),
      entryFee: template.entryFee.toString(),
      startingChips: template.startingChips.toString(),
      levelDuration: template.levelDurationMinutes.toString(),
      breakInterval: template.breakInterval.toString(),
      breakDuration: template.breakDurationMinutes.toString(),
    });
    
    // Navigate to the new tournament page with template parameters
    router.push(`/tournament/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-[#f0f0f5] dark:from-[#111111] dark:to-[#000000] text-gray-900 dark:text-white transition-colors duration-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md dark:bg-black/40 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-screen-xl mx-auto p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold tracking-tight"
              >
                Tournament Templates
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Choose from pre-configured tournament structures
              </motion.p>
            </div>
            
            <div className="flex gap-2">
              <Link href="/" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                Home
              </Link>
              <Link href="/tournament/new" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm">
                Custom Tournament
              </Link>
              <button 
                onClick={handleUseTemplate}
                disabled={!selectedTemplate}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  selectedTemplate
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Use Selected Template
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {templates.map((template) => (
            <div 
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`
                bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden 
                border-2 transition-all duration-200 cursor-pointer hover:shadow-xl
                ${selectedTemplate === template.id 
                  ? 'border-blue-500 dark:border-blue-400 scale-[1.02]' 
                  : 'border-transparent scale-100 hover:scale-[1.01]'
                }
              `}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{template.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Buy-in:</span> 
                    <span className="font-medium ml-1">${template.buyIn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Entry Fee:</span> 
                    <span className="font-medium ml-1">${template.entryFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Starting:</span> 
                    <span className="font-medium ml-1">{template.startingChips.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Levels:</span> 
                    <span className="font-medium ml-1">{template.blindLevels.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span> 
                    <span className="font-medium ml-1">{template.levelDurationMinutes}min</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Break:</span> 
                    <span className="font-medium ml-1">Every {template.breakInterval} levels</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(template.levelDurationMinutes * template.blindLevels.length / 60)} hour estimated
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    template.levelDurationMinutes <= 8
                      ? 'bg-red-500'
                      : template.levelDurationMinutes <= 15
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}></div>
                </div>
              </div>
              
              <div className="px-6 pb-6">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Sample Blind Levels
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-1">Level</th>
                        <th className="text-left p-1">Small</th>
                        <th className="text-left p-1">Big</th>
                        <th className="text-left p-1">Ante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {template.blindLevels.slice(0, 5).map((level, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-1">{idx + 1}</td>
                          <td className="p-1">{level.small}</td>
                          <td className="p-1">{level.big}</td>
                          <td className="p-1">{level.ante || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {template.blindLevels.length > 5 && (
                  <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    +{template.blindLevels.length - 5} more levels
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
} 