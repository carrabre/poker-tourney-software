import { Payout } from '@/app/types';

/**
 * Generates default tournament payouts based on the number of players and prize pool
 * @param places Number of places to pay
 * @param prizePool Total prize pool amount
 * @returns Array of payout objects with position, percentage, and amount
 */
export function generateDefaultPayouts(
  places: number,
  prizePool: number
): Payout[] {
  const payouts: Payout[] = [];
  
  // Default payout percentages based on number of places
  let percentages: number[] = [];
  
  if (places === 1) {
    percentages = [100];
  } else if (places === 2) {
    percentages = [65, 35];
  } else if (places === 3) {
    percentages = [50, 30, 20];
  } else if (places <= 5) {
    percentages = [45, 25, 15, 10, 5];
  } else if (places <= 9) {
    percentages = [30, 20, 15, 10, 7, 6, 5, 4, 3];
  } else {
    // For larger tournaments
    percentages = [25, 15, 10, 7.5, 6, 5, 4, 3, 2.5, 2];
    
    // Add small percentages for remaining places
    const remainingPlaces = places - percentages.length;
    const remainingPercentage = 20; // 20% for all remaining places
    const equalShare = remainingPercentage / remainingPlaces;
    
    for (let i = 0; i < remainingPlaces; i++) {
      percentages.push(equalShare);
    }
  }
  
  // Calculate actual payouts
  for (let i = 0; i < places; i++) {
    if (i < percentages.length) {
      const percentage = percentages[i];
      const amount = Math.round((percentage / 100) * prizePool);
      
      payouts.push({
        position: i + 1,
        percentage,
        amount
      });
    }
  }
  
  // Ensure the sum of amounts equals the prize pool
  let totalAllocated = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  
  // Adjust the first place amount to ensure the total matches the prize pool exactly
  if (totalAllocated !== prizePool && payouts.length > 0) {
    payouts[0].amount += prizePool - totalAllocated;
  }
  
  return payouts;
} 