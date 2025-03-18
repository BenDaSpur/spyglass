# Spyglass

Spyglass is a Reddit analytics tool that tracks user activity across multiple subreddits, providing insights into user interactions, comment patterns, and cross-subreddit engagement.

## Features

- Track user activity across multiple subreddits
- View comprehensive statistics about subreddit interactions
- Identify users who are active in multiple communities
- Filter data by date ranges (including pre/post Oct 7th, 2023)
- Real-time updates of tracked statistics
- Interactive data visualization with bar charts

## Tech Stack

- **Fullstack**: SvelteKit, Sveltestrap (Bootstrap components)
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis (via Upstash)
- **API**: Reddit API (via Snoowrap)
- **Data Visualization**: ApexCharts, D3.js
- **Testing**: Not implemented
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL database
- Redis instance (optional)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/spyglass.git
   cd spyglass
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your environment variables:

   ```
   POSTGRES_URL=your_postgres_connection_string
   REDIS_URL=your_redis_url (optional)
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   ```

4. Initialize the database

   ```bash
   npx prisma db push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript checks
- `npm run format` - Format code with Prettier
- `npm run lint` - Run linting

## Tracked Subreddits

By default, Spyglass tracks activity from the following subreddits:

- h3h3productions
- h3snark
- Hasan_Piker
- Destiny
- LivestreamFail
- LeftoversH3

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
