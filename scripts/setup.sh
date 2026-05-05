#!/bin/bash
# MVP Template Setup Script
# Run once after cloning: bash scripts/setup.sh

set -e

echo "🚀 Setting up MVP template..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Copy env file
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local — fill in your keys before running"
else
  echo "⚠️  .env.local already exists, skipping"
fi

# 3. Supabase CLI check
if command -v supabase &> /dev/null; then
  echo "✅ Supabase CLI found"
else
  echo "⚠️  Supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo "  1. Fill in .env.local with your API keys"
echo "  2. Set up Supabase project and run: npm run db:migrate"
echo "  3. Set up Clerk at https://clerk.com"
echo "  4. Set up Resend at https://resend.com"
echo "  5. Run: npm run dev"
