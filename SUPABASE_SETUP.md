# Supabase Setup Instructions

## The Issue: Missing Database Tables

You're encountering an error because the required database tables have not been created in your Supabase project. The application needs two tables: `tournaments` and `players`.

## Quick Fix: Use the "Setup Database" Button

We've added a purple "Setup Database" button in the top right corner of the Create Tournament page. Click this button to:

1. Automatically check if your tables exist
2. Attempt to create them if they don't exist
3. Show you the results of the operation

This is the easiest way to fix the issue!

## Alternative Fix: Manual Table Creation

If the button doesn't work (or if you want to create the tables yourself), you have several options:

### Option 1: Using the Supabase Table Editor (Easiest Manual Method)

1. **Login to your Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project: `mqwanqquqapqnuleafqf`

2. **Create the Tournaments Table**
   - Click on "Table Editor" in the left sidebar
   - Click "New Table"
   - Enter the following information:
     - Name: `tournaments`
     - Enable Row Level Security: ✅ Checked
     - Columns:
       - `id` (type: text, primary key: ✅)
       - `name` (type: text, nullable: ❌)
       - `startingChips` (type: int8, nullable: ❌)
       - `buyIn` (type: int8, nullable: ❌)
       - `entryFee` (type: int8, nullable: ❌)
       - `maxRebuys` (type: int8, nullable: ❌)
       - `rebuyAmount` (type: int8, nullable: ❌)
       - `rebuyChips` (type: int8, nullable: ❌)
       - `allowAddOns` (type: boolean, nullable: ❌)
       - `addOnAmount` (type: int8, nullable: ❌)
       - `addOnChips` (type: int8, nullable: ❌)
       - `nextBreak` (type: int8, nullable: ❌)
       - `breakLength` (type: int8, nullable: ❌)
       - `created_at` (type: timestamptz, default: `now()`)
       - `updated_at` (type: timestamptz, default: `now()`)
   - Click "Save" to create the table

3. **Create the Players Table**
   - Click "New Table" again
   - Enter the following information:
     - Name: `players`
     - Enable Row Level Security: ✅ Checked
     - Columns:
       - `id` (type: text, primary key: ✅)
       - `tournamentId` (type: text, nullable: ❌)
       - `name` (type: text, nullable: ❌)
       - `email` (type: text, nullable: ✅)
       - `tableNumber` (type: int8, nullable: ❌)
       - `seatNumber` (type: int8, nullable: ❌)
       - `chips` (type: int8, nullable: ❌)
       - `status` (type: text, nullable: ❌)
       - `finishPosition` (type: int8, nullable: ✅)
       - `rebuys` (type: int8, nullable: ❌, default: 0)
       - `addOns` (type: int8, nullable: ❌, default: 0)
       - `created_at` (type: timestamptz, default: `now()`)
       - `updated_at` (type: timestamptz, default: `now()`)
   - Click "Save" to create the table

4. **Set RLS Policies**
   - For each table, go to "Authentication" → "Policies"
   - Add the following policies for both tables:
     - **For tournaments table**: Click "New Policy" → "Get started quickly" → "Enable read access to everyone" → "Review" → "Save policy"
     - **For tournaments table**: Click "New Policy" → "Get started quickly" → "Enable insert access to everyone" → "Review" → "Save policy"
     - **For tournaments table**: Click "New Policy" → "Get started quickly" → "Enable update access to everyone" → "Review" → "Save policy"
     - Repeat the same steps for the players table, plus add one more:
     - **For players table**: Click "New Policy" → "Get started quickly" → "Enable delete access to everyone" → "Review" → "Save policy"

### Option 2: Using the Supabase SQL Editor

1. **Login to your Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project: `mqwanqquqapqnuleafqf`

2. **Open the SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query" to create a new SQL query

3. **Create the Players Table**
   - Copy the contents of `supabase/migrations/20230701000000_create_players_table.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the query

4. **Create the Tournaments Table**
   - Create another new query
   - Copy the contents of `supabase/migrations/20230701000001_create_tournaments_table.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the query

### Option 3: Using the Supabase CLI

If you have the Supabase CLI installed:

1. **Link your project**
   ```bash
   supabase link --project-ref mqwanqquqapqnuleafqf
   ```

2. **Push the migrations**
   ```bash
   supabase db push
   ```

## Additional Troubleshooting

If you continue to experience issues:

1. **Check for Errors in the SQL Console**: 
   - After running the SQL, check for any error messages.

2. **Verify Table Structure**:
   - In the Table Editor, check that the tables have all the expected columns.

3. **Check RLS Policies**:
   - Go to "Authentication" → "Policies" to verify that the RLS policies have been correctly applied.

## After Setup

Once you've successfully created the database tables:

1. Return to your application
2. Try creating a tournament again
3. The error "Failed to create tournament: undefined" should no longer appear

If you still encounter issues, check the browser console for more detailed error messages. 