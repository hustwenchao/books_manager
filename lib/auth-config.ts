export const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  return `http://localhost:3000`;
};

export const authConfig = {
  baseUrl: getBaseUrl(),
  authUrl: `${getBaseUrl()}/api/auth`,
  callbackUrl: `${getBaseUrl()}/api/auth/callback`,
};
