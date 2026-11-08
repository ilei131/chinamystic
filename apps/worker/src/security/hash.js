export async function sha256Hex(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function getCookie(request, name) {
    const raw = request.headers.get('Cookie') ?? '';
    for (const part of raw.split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name)
            return decodeURIComponent(v.join('='));
    }
    return null;
}
export function newCookieId() {
    return crypto.randomUUID();
}
