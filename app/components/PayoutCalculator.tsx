'use client';

import { useState, useEffect } from 'react';

interface Payout {
  position: number;
  percentage: number;
  amount: number;
}

interface PayoutStructure {
  id: string;
  name: string;
  description: string;
  calculatePayouts: (entrants: number, prizePool: number) => Payout[];
}

interface PayoutCalculatorProps {
  entrants: number;
  buyIn: number;
  fees: number;
  rebuys: number;
  rebuyAmount: number;
  addOns: number;
  addOnAmount: number;
  onPayoutsCalculated?: (payouts: Payout[]) => void;
}

const PayoutCalculator: React.FC<PayoutCalculatorProps> = ({
  entrants,
  buyIn,
  fees = 0,
  rebuys = 0,
  rebuyAmount = buyIn,
  addOns = 0,
  addOnAmount = buyIn,
  onPayoutsCalculated,
}) => {
  // Calculate prize pool
  const totalEntries = entrants;
  const totalRebuys = rebuys;
  const totalAddOns = addOns;
  const prizePool = (totalEntries * buyIn) + (totalRebuys * rebuyAmount) + (totalAddOns * addOnAmount);

  // Payout structure selection
  const [selectedStructureId, setSelectedStructureId] = useState<string>('standard');
  const [customPercentages, setCustomPercentages] = useState<{ position: number; percentage: number }[]>([
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ]);
  const [payingPlaces, setPayingPlaces] = useState<number>(Math.max(3, Math.ceil(entrants * 0.15)));
  const [calculatedPayouts, setCalculatedPayouts] = useState<Payout[]>([]);
  
  // Define payout structures
  const payoutStructures: PayoutStructure[] = [
    {
      id: 'standard',
      name: 'Standard (15%)',
      description: 'Pays approximately 15% of the field with a standard distribution.',
      calculatePayouts: (entrants, prizePool) => {
        const places = Math.max(3, Math.ceil(entrants * 0.15));
        const payouts: Payout[] = [];
        
        // First place gets 30-40% depending on field size
        const firstPlacePercentage = Math.max(30, Math.min(40, 50 - entrants * 0.05));
        
        // Calculate standard distribution
        for (let i = 1; i <= places; i++) {
          let percentage = 0;
          
          if (i === 1) {
            percentage = firstPlacePercentage;
          } else if (i === 2) {
            percentage = firstPlacePercentage * 0.6;
          } else if (i === 3) {
            percentage = firstPlacePercentage * 0.4;
          } else if (i <= 5) {
            percentage = firstPlacePercentage * 0.25;
          } else if (i <= 10) {
            percentage = firstPlacePercentage * 0.15;
          } else if (i <= 15) {
            percentage = firstPlacePercentage * 0.10;
          } else {
            percentage = firstPlacePercentage * 0.05;
          }
          
          payouts.push({
            position: i,
            percentage,
            amount: Math.floor(prizePool * percentage / 100)
          });
        }
        
        // Normalize to ensure sum is 100%
        const totalPercentage = payouts.reduce((sum, payout) => sum + payout.percentage, 0);
        const normalizedPayouts = payouts.map(payout => ({
          ...payout,
          percentage: (payout.percentage / totalPercentage) * 100,
          amount: Math.floor((payout.percentage / totalPercentage) * prizePool)
        }));
        
        return normalizedPayouts;
      }
    },
    {
      id: 'flat',
      name: 'Flat (20%)',
      description: 'Pays more places (20% of field) with a flatter payout structure.',
      calculatePayouts: (entrants, prizePool) => {
        const places = Math.max(3, Math.ceil(entrants * 0.2));
        const payouts: Payout[] = [];
        
        // First place gets 25-30% depending on field size
        const firstPlacePercentage = Math.max(25, Math.min(30, 35 - entrants * 0.05));
        
        // Calculate flatter distribution
        for (let i = 1; i <= places; i++) {
          let percentage = 0;
          
          if (i === 1) {
            percentage = firstPlacePercentage;
          } else if (i === 2) {
            percentage = firstPlacePercentage * 0.7;
          } else if (i === 3) {
            percentage = firstPlacePercentage * 0.5;
          } else if (i <= 5) {
            percentage = firstPlacePercentage * 0.3;
          } else if (i <= 10) {
            percentage = firstPlacePercentage * 0.2;
          } else if (i <= 20) {
            percentage = firstPlacePercentage * 0.15;
          } else {
            percentage = firstPlacePercentage * 0.1;
          }
          
          payouts.push({
            position: i,
            percentage,
            amount: Math.floor(prizePool * percentage / 100)
          });
        }
        
        // Normalize to ensure sum is 100%
        const totalPercentage = payouts.reduce((sum, payout) => sum + payout.percentage, 0);
        const normalizedPayouts = payouts.map(payout => ({
          ...payout,
          percentage: (payout.percentage / totalPercentage) * 100,
          amount: Math.floor((payout.percentage / totalPercentage) * prizePool)
        }));
        
        return normalizedPayouts;
      }
    },
    {
      id: 'steep',
      name: 'Top Heavy (10%)',
      description: 'Pays fewer places (10% of field) with bigger payouts at the top.',
      calculatePayouts: (entrants, prizePool) => {
        const places = Math.max(3, Math.ceil(entrants * 0.1));
        const payouts: Payout[] = [];
        
        // First place gets 40-50% depending on field size
        const firstPlacePercentage = Math.max(40, Math.min(50, 60 - entrants * 0.05));
        
        // Calculate steep distribution
        for (let i = 1; i <= places; i++) {
          let percentage = 0;
          
          if (i === 1) {
            percentage = firstPlacePercentage;
          } else if (i === 2) {
            percentage = firstPlacePercentage * 0.5;
          } else if (i === 3) {
            percentage = firstPlacePercentage * 0.3;
          } else if (i <= 5) {
            percentage = firstPlacePercentage * 0.15;
          } else if (i <= 9) {
            percentage = firstPlacePercentage * 0.1;
          } else {
            percentage = firstPlacePercentage * 0.05;
          }
          
          payouts.push({
            position: i,
            percentage,
            amount: Math.floor(prizePool * percentage / 100)
          });
        }
        
        // Normalize to ensure sum is 100%
        const totalPercentage = payouts.reduce((sum, payout) => sum + payout.percentage, 0);
        const normalizedPayouts = payouts.map(payout => ({
          ...payout,
          percentage: (payout.percentage / totalPercentage) * 100,
          amount: Math.floor((payout.percentage / totalPercentage) * prizePool)
        }));
        
        return normalizedPayouts;
      }
    },
    {
      id: 'final-table',
      name: 'Final Table Only',
      description: 'Pays only final table positions (typically 9 players).',
      calculatePayouts: (entrants, prizePool) => {
        const places = Math.min(9, entrants);
        const payouts: Payout[] = [];
        
        // Fixed percentages for final table
        const percentages = [50, 30, 20, 12, 10, 8, 7, 6, 5];
        
        for (let i = 1; i <= places; i++) {
          const percentage = percentages[i - 1];
          
          payouts.push({
            position: i,
            percentage,
            amount: Math.floor(prizePool * percentage / 100)
          });
        }
        
        // Normalize to ensure sum is 100%
        const totalPercentage = payouts.reduce((sum, payout) => sum + payout.percentage, 0);
        const normalizedPayouts = payouts.map(payout => ({
          ...payout,
          percentage: (payout.percentage / totalPercentage) * 100,
          amount: Math.floor((payout.percentage / totalPercentage) * prizePool)
        }));
        
        return normalizedPayouts;
      }
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Define your own payout percentages.',
      calculatePayouts: (entrants, prizePool) => {
        return customPercentages.map(({ position, percentage }) => ({
          position,
          percentage,
          amount: Math.floor(prizePool * percentage / 100)
        }));
      }
    }
  ];
  
  // Find the selected structure
  const selectedStructure = payoutStructures.find(s => s.id === selectedStructureId) || payoutStructures[0];
  
  // Calculate payouts when inputs change
  useEffect(() => {
    if (selectedStructureId === 'custom') {
      // For custom, use the user-defined percentages
      const customPayouts = customPercentages.map(({ position, percentage }) => ({
        position,
        percentage,
        amount: Math.floor(prizePool * percentage / 100)
      }));
      
      setCalculatedPayouts(customPayouts);
      if (onPayoutsCalculated) onPayoutsCalculated(customPayouts);
    } else {
      // For predefined structures, use the structure's calculation function
      const payouts = selectedStructure.calculatePayouts(entrants, prizePool);
      setCalculatedPayouts(payouts);
      if (onPayoutsCalculated) onPayoutsCalculated(payouts);
    }
  }, [
    selectedStructureId, 
    entrants, 
    prizePool, 
    customPercentages, 
    selectedStructure, 
    onPayoutsCalculated
  ]);
  
  // Add a custom payout position
  const addCustomPosition = () => {
    if (customPercentages.length >= 20) return;
    
    setCustomPercentages([
      ...customPercentages,
      { position: customPercentages.length + 1, percentage: 5 }
    ]);
  };
  
  // Remove a custom payout position
  const removeCustomPosition = (index: number) => {
    if (customPercentages.length <= 1) return;
    
    const updatedPercentages = customPercentages
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, position: i + 1 }));
    
    setCustomPercentages(updatedPercentages);
  };
  
  // Update a custom payout percentage
  const updateCustomPercentage = (index: number, percentage: number) => {
    const updatedPercentages = [...customPercentages];
    updatedPercentages[index] = { 
      ...updatedPercentages[index], 
      percentage: Math.max(0, Math.min(100, percentage)) 
    };
    
    setCustomPercentages(updatedPercentages);
  };
  
  // Calculate the total custom percentage
  const totalCustomPercentage = customPercentages.reduce((sum, { percentage }) => sum + percentage, 0);
  
  // Check if custom percentages are valid
  const isCustomValid = Math.abs(totalCustomPercentage - 100) < 0.01;
  
  return (
    <div className="bg-gray-900 text-white">
      {/* Payout Summary */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-bold mb-2 md:mb-0">Payout Structure</h2>
          
          <select 
            className="w-full md:w-auto bg-gray-700 border border-gray-600 rounded-lg p-2"
            value={selectedStructureId}
            onChange={(e) => setSelectedStructureId(e.target.value)}
          >
            {payoutStructures.map(structure => (
              <option key={structure.id} value={structure.id}>
                {structure.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          {selectedStructure.description}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Total Entries</div>
            <div className="text-xl font-bold">{totalEntries}</div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Rebuys/Add-ons</div>
            <div className="text-xl font-bold">{totalRebuys + totalAddOns}</div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Prize Pool</div>
            <div className="text-xl font-bold text-emerald-400">${prizePool.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Paying Places</div>
            <div className="text-xl font-bold">{calculatedPayouts.length}</div>
          </div>
        </div>
      </div>
      
      {/* Custom Payout Editor (only shown when 'custom' is selected) */}
      {selectedStructureId === 'custom' && (
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold mb-4">Custom Payout Percentages</h3>
          
          <div className="mb-4">
            <div className={`p-3 rounded-lg mb-3 ${
              isCustomValid ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'
            }`}>
              Total: {totalCustomPercentage.toFixed(1)}% {!isCustomValid && '(Must equal 100%)'}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {customPercentages.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 text-sm text-gray-400">{item.position}:</div>
                  <input 
                    type="number"
                    className="w-[calc(100%-2.5rem)] bg-gray-700 border border-gray-600 rounded-lg p-2"
                    value={item.percentage}
                    onChange={(e) => updateCustomPercentage(index, Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <button 
                    onClick={() => removeCustomPosition(index)}
                    className="ml-1 text-red-400 hover:text-red-300"
                    title="Remove position"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={addCustomPosition}
            disabled={customPercentages.length >= 20}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            Add Position
          </button>
        </div>
      )}
      
      {/* Payout Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-900 p-3 border-b border-gray-700">
          <h3 className="font-bold">Final Payouts</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">Position</th>
                <th className="text-left p-3">Percentage</th>
                <th className="text-left p-3">Payout Amount</th>
              </tr>
            </thead>
            <tbody>
              {calculatedPayouts.map((payout) => (
                <tr key={payout.position} className="border-b border-gray-700">
                  <td className="p-3">
                    {payout.position}{getOrdinalSuffix(payout.position)}
                  </td>
                  <td className="p-3">{payout.percentage.toFixed(1)}%</td>
                  <td className="p-3 font-medium">${payout.amount.toLocaleString()}</td>
                </tr>
              ))}
              
              {calculatedPayouts.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    No payouts calculated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper function for ordinal suffixes
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

export default PayoutCalculator; 