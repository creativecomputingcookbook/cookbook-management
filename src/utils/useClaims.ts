import { useEffect, useState } from 'react';

export function useClaims() {
  const [claims, setClaims] = useState<{ admin: boolean; uid: string } | null>(null);
  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await fetch('/api/auth/claims');
        if (res.ok) {
          setClaims(await res.json());
        } else {
          setClaims(null);
        }
      } catch {
        setClaims(null);
      }
    }
    fetchClaims();
  }, []);
  return claims;
}
