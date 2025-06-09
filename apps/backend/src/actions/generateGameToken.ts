import * as crypto from 'crypto';

const AES_KEY = Buffer.from(process.env.AES_KEY!, 'hex');
const AES_IV = Buffer.from(process.env.AES_IV!, 'hex');


export function generateGameToken(data: string): string {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(AES_KEY), Buffer.from(AES_IV));
    let encrypted = cipher.update(data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
}
