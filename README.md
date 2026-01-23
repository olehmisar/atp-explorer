# ATP Explorer

An explorer for visualizing Aztec Token Position (ATP) statistics on Ethereum mainnet.

## Features

- **ATP Discovery**: Automatically discovers ATP contracts by checking token holders for ATP interface methods
- **ATP Statistics**: View total allocations, claimed amounts, and claimable balances
- **Token Holders**: Display AZTEC token holders fetched from Moralis API
- **Type Distribution**: Visualize the distribution of ATP types (LATP, MATP, NCATP)
- **ATP Table**: Detailed view of all ATP positions with their status and metadata

## ATP Types

- **LATP (Linear)**: Linearly unlocked ATP positions
- **MATP (Milestone)**: Milestone-based ATP positions
- **NCATP (Non-Claim)**: Non-claimable ATP positions

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   - `MORALIS_API_KEY`: Your Moralis API key (get it from [Moralis Admin](https://admin.moralis.io/))
   - `NEXT_PUBLIC_AZTEC_TOKEN_ADDRESS`: The AZTEC token contract address on Ethereum mainnet (defaults to `0xa27ec0006e59f245217ff08cd52a7e8b169e62d2`)
   - `RPC_URL` (optional): Custom RPC endpoint for on-chain queries (defaults to public RPC)
   - `MAX_ATP_CHECK` (optional): Maximum number of token holder addresses to check for ATP contracts (defaults to 1000)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
atp-explorer/
├── app/
│   ├── api/
│   │   ├── stats/route.ts      # API endpoint for ATP statistics
│   │   └── atps/route.ts       # API endpoint for ATP data
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main explorer page
│   └── globals.css             # Global styles
├── components/
│   ├── ATPTable.tsx            # Table component for ATP positions
│   ├── StatsCards.tsx          # Statistics cards component
│   ├── TokenHoldersList.tsx    # Token holders list component
│   └── TypeDistribution.tsx    # Pie chart for ATP type distribution
├── lib/
│   ├── atp-detector.ts        # ATP contract detection and data fetching
│   ├── constants.ts            # Constants and configuration
│   ├── moralis.ts              # Moralis API integration
│   └── utils.ts                # Utility functions
├── types/
│   └── atp.ts                  # TypeScript type definitions
└── package.json
```

## How ATP Discovery Works

The explorer automatically discovers ATP contracts using the following process:

1. **Fetch Token Holders**: Gets all AZTEC token holders from Moralis API
2. **Detect ATP Contracts**: For each token holder address, checks if it implements ATP interface methods:
   - Calls `getType()` to verify it returns a valid ATP type (0, 1, or 2)
   - Calls `getBeneficiary()` to verify it returns a valid address
   - If both succeed, the address is identified as an ATP contract
3. **Fetch ATP Data**: For each discovered ATP, fetches all relevant data:
   - `getType()` - ATP type (Linear, Milestone, or NonClaim)
   - `getBeneficiary()` - Beneficiary address
   - `getAllocation()` - Total allocation
   - `getClaimed()` - Amount claimed
   - `getClaimable()` - Amount claimable
   - `getGlobalLock()` - Lock parameters
   - `getIsRevokable()` - Whether revokable
   - `getIsRevoked()` - Whether revoked (for MATP)
   - `getMilestoneId()` - Milestone ID (for MATP)
   - `TOKEN.balanceOf()` - Current token balance

The discovery process is optimized with:
- Batch processing (20 addresses at a time)
- Progress logging
- Error handling for failed contract calls
- Configurable limit on number of addresses to check (via `MAX_ATP_CHECK` env var)

**Note**: The first load may take some time as it checks multiple addresses. Subsequent loads will be faster if you implement caching.

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Moralis**: Blockchain data API
- **Recharts**: Data visualization
- **Viem**: Ethereum utilities

## License

UNLICENSED
