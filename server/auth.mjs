import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const token = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64, options);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [, salt, encoded] = stored.split(':');
  const key = await derive(password, salt, 64, options);
  const expected = Buffer.from(encoded, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function sameSecret(a, b) {
  const left = Buffer.from(digest(a)), right = Buffer.from(digest(b));
  return timingSafeEqual(left,right);
}
