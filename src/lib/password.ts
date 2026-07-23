import crypto from "crypto";

// Sin caracteres ambiguos (0/O, 1/l/I) para que sea legible si alguien la transcribe a mano
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateRandomPassword(length = 12): string {
    const bytes = crypto.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
        password += CHARSET[bytes[i] % CHARSET.length];
    }
    return password;
}
