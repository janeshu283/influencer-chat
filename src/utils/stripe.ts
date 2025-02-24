import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function createTestCustomer(email: string) {
  return await stripe.customers.create({
    email,
  });
}
