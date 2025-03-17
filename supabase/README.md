# Supabase Database Migrations

This directory contains SQL migrations for the Supabase database. These migrations help set up the necessary database schema for the poker tournament application.

## Migration Files

- `20230701000000_create_players_table.sql`: Creates the players table with all necessary columns and RLS policies
- `20230701000001_create_tournaments_table.sql`: Creates the tournaments table with all necessary columns and RLS policies

## Applying Migrations

The migrations can be applied manually through the Supabase dashboard's SQL editor:

1. Login to your Supabase dashboard: https://app.supabase.com
2. Open your project
3. Go to "SQL Editor" in the left sidebar
4. Create a new query
5. Copy and paste the contents of each migration file
6. Run the SQL query

Alternatively, if you have the Supabase CLI installed, you can use it to apply migrations with:

```bash
supabase link --project-ref mqwanqquqapqnuleafqf
supabase db push
```

## Database Schema

### Players Table

This table stores information about players in tournaments.

| Column         | Type        | Description                           |
|----------------|-------------|---------------------------------------|
| id             | TEXT        | Primary key (unique identifier)       |
| tournamentId   | TEXT        | ID of the tournament                  |
| name           | TEXT        | Player's name                         |
| email          | TEXT        | Player's email (optional)             |
| tableNumber    | INTEGER     | Table number assignment               |
| seatNumber     | INTEGER     | Seat number assignment                |
| chips          | INTEGER     | Current chip count                    |
| status         | TEXT        | Player status (active/eliminated/etc) |
| finishPosition | INTEGER     | Final position in tournament          |
| rebuys         | INTEGER     | Number of rebuys                      |
| addOns         | INTEGER     | Number of add-ons                     |
| created_at     | TIMESTAMPTZ | Creation timestamp                    |
| updated_at     | TIMESTAMPTZ | Last update timestamp                 |

### Tournaments Table

This table stores information about tournaments.

| Column         | Type        | Description                           |
|----------------|-------------|---------------------------------------|
| id             | TEXT        | Primary key (unique identifier)       |
| name           | TEXT        | Tournament name                       |
| startingChips  | INTEGER     | Starting chip amount                  |
| buyIn          | INTEGER     | Buy-in amount                         |
| entryFee       | INTEGER     | Entry fee amount                      |
| maxRebuys      | INTEGER     | Maximum number of rebuys allowed      |
| rebuyAmount    | INTEGER     | Rebuy cost                            |
| rebuyChips     | INTEGER     | Chips received for rebuy              |
| allowAddOns    | BOOLEAN     | Whether add-ons are allowed           |
| addOnAmount    | INTEGER     | Add-on cost                           |
| addOnChips     | INTEGER     | Chips received for add-on             |
| nextBreak      | INTEGER     | Level interval for breaks             |
| breakLength    | INTEGER     | Length of breaks in minutes           |
| created_at     | TIMESTAMPTZ | Creation timestamp                    |
| updated_at     | TIMESTAMPTZ | Last update timestamp                 | 