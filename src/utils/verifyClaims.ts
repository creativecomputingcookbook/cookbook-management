import { getTokens } from 'next-firebase-auth-edge';
import { cookies } from 'next/headers';
import authOptions from '@/utils/authOptions';

export async function verifyClaims() {
    const tokens = await getTokens(await cookies(), authOptions);
    if (!tokens) return null;
    if ((tokens.metadata as {admin?: boolean}).admin && tokens.decodedToken.admin) {
        return ({ admin: true });
    }
    return ({ admin: false });
}