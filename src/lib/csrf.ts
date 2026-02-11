/**
 * CSRF Double-Submit Pattern
 * Reads the CSRF token from the cookie set by the server during auth.
 * This token must be sent as X-CSRF-Token header on all mutating requests.
 */

const CSRF_COOKIE_NAME = 'csrf_token';

export function getCsrfToken(): string {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return '';
}
