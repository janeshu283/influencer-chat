# Influencer Chat Application

This is a Next.js-based chat application that enables real-time communication between influencers and their followers, featuring a Super Chat functionality for monetary support.

## Features

- Real-time chat functionality
- Super Chat support with Stripe integration
- User authentication with Supabase
- Influencer profile management
- Responsive design

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Technologies Used

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.io)
- [Stripe](https://stripe.com)
- [Tailwind CSS](https://tailwindcss.com)
