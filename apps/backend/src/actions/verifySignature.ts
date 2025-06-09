import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const razr_secret = process.env.RAZORPAY_SECRET!



export const verifySignature = (orderId: string, paymentId: string, signature: string) => {
  const generatedSignature = crypto
    .createHmac('sha256', razr_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
};
