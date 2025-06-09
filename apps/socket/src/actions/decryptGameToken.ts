import * as crypto from 'crypto';
import dotenv from 'dotenv'

dotenv.config()

const AES_KEY = Buffer.from(process.env.AES_KEY!, 'hex'); // 32 bytes
const AES_IV = Buffer.from(process.env.AES_IV!, 'hex'); 
export const decryptGameToken = (data: string) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(AES_KEY), Buffer.from(AES_IV));
    let decrypted = decipher.update(data, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}