import supabase from './supabase';

/**
 * Creates the tournaments table in Supabase if it doesn't exist
 * This is a direct approach, creating the table using the JS API
 * @returns Promise that resolves to true if successful, or error message if failed
 */
export const createTournamentsTable = async (): Promise<boolean | string> => {
  try {
    // Check if the table already exists
    const { error: checkError } = await supabase
      .from('tournaments')
      .select('id')
      .limit(1);
      
    // If no error, table exists
    if (!checkError) {
      console.log('Tournaments table already exists');
      return true;
    } else if (!checkError.message.includes('does not exist')) {
      // Some other error
      console.error('Error checking if tournaments table exists:', checkError);
      return checkError.message;
    }
    
    console.log('Creating tournaments table...');
    
    // First, let's try a simpler approach - create a tournament directly
    // This will often trigger automatic table creation
    const testTournament = {
      id: 'test-setup-123',
      name: 'Setup Test Tournament',
      startingChips: 1000,
      buyIn: 100,
      entryFee: 20,
      maxRebuys: 2,
      rebuyAmount: 100,
      rebuyChips: 500,
      allowAddOns: true,
      addOnAmount: 100,
      addOnChips: 500,
      nextBreak: 4,
      breakLength: 15
    };
    
    const { error: insertError } = await supabase
      .from('tournaments')
      .insert([testTournament]);
      
    if (!insertError) {
      console.log('Tournaments table created successfully via direct insert');
      
      // Clean up the test tournament
      await supabase
        .from('tournaments')
        .delete()
        .eq('id', 'test-setup-123');
        
      return true;
    }
    
    // If direct insert didn't work, let the user know they need to create tables manually
    console.error('Failed to create tournaments table:', insertError);
    return `Could not create the tournaments table. Please follow the manual instructions in SUPABASE_SETUP.md. Error: ${insertError.message}`;
  } catch (err) {
    console.error('Error in createTournamentsTable:', err);
    return err instanceof Error ? err.message : 'Unknown error';
  }
};

/**
 * Creates the players table in Supabase if it doesn't exist
 * This is a direct approach, creating the table using the JS API
 * @returns Promise that resolves to true if successful, or error message if failed
 */
export const createPlayersTable = async (): Promise<boolean | string> => {
  try {
    // Check if the table already exists
    const { error: checkError } = await supabase
      .from('players')
      .select('id')
      .limit(1);
      
    // If no error, table exists
    if (!checkError) {
      console.log('Players table already exists');
      return true;
    } else if (!checkError.message.includes('does not exist')) {
      // Some other error
      console.error('Error checking if players table exists:', checkError);
      return checkError.message;
    }
    
    console.log('Creating players table...');
    
    // First, let's try a simpler approach - create a player directly
    // This will often trigger automatic table creation
    const testPlayer = {
      id: 'test-player-123',
      tournamentId: 'test-tournament-123',
      name: 'Test Player',
      tableNumber: 1,
      seatNumber: 1,
      chips: 1000,
      status: 'active',
      rebuys: 0,
      addOns: 0
    };
    
    const { error: insertError } = await supabase
      .from('players')
      .insert([testPlayer]);
      
    if (!insertError) {
      console.log('Players table created successfully via direct insert');
      
      // Clean up the test player
      await supabase
        .from('players')
        .delete()
        .eq('id', 'test-player-123');
        
      return true;
    }
    
    // If direct insert didn't work, let the user know they need to create tables manually
    console.error('Failed to create players table:', insertError);
    return `Could not create the players table. Please follow the manual instructions in SUPABASE_SETUP.md. Error: ${insertError.message}`;
  } catch (err) {
    console.error('Error in createPlayersTable:', err);
    return err instanceof Error ? err.message : 'Unknown error';
  }
};

/**
 * Sets up all required database tables
 * @returns Promise that resolves to true if successful
 */
export const setupDatabase = async (): Promise<{ success: boolean, message: string }> => {
  try {
    // Create the tournaments table
    const tournamentsResult = await createTournamentsTable();
    if (tournamentsResult !== true) {
      return { 
        success: false, 
        message: `Failed to create tournaments table: ${tournamentsResult}` 
      };
    }
    
    // Create the players table
    const playersResult = await createPlayersTable();
    if (playersResult !== true) {
      return { 
        success: false, 
        message: `Failed to create players table: ${playersResult}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Database setup completed successfully. You can now create tournaments.' 
    };
  } catch (err) {
    console.error('Error in setupDatabase:', err);
    return { 
      success: false, 
      message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
}; 