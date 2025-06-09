export function generateSecureId(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsetLength = charset.length;
  let result = '';
  const values = new Uint8Array(length);

  // Use crypto API
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto');
    const buffer = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      values[i] = buffer[i];
    }
  }

  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charsetLength];
  }

  return result;
}

