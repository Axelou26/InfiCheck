import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DISCLAIMER = 'inficheck:disclaimer';

/**
 * À incrémenter dès que le texte des conditions d'usage change (ou que l'arrêté
 * de référence évolue) : une version inconnue force une nouvelle acceptation.
 */
export const DISCLAIMER_VERSION = '2026-06-26.1';

export type DisclaimerAcceptance = {
  version: string;
  acceptedAt: string;
};

/**
 * Lecture « prudente » : si le stockage est illisible, on considère que rien n'a
 * été accepté — mieux vaut réafficher les conditions que de les sauter.
 */
export async function readDisclaimerAcceptance(): Promise<DisclaimerAcceptance | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_DISCLAIMER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DisclaimerAcceptance>;
    if (typeof parsed.version !== 'string' || typeof parsed.acceptedAt !== 'string') {
      return null;
    }
    return { version: parsed.version, acceptedAt: parsed.acceptedAt };
  } catch {
    return null;
  }
}

export function isAcceptanceCurrent(acceptance: DisclaimerAcceptance | null): boolean {
  return acceptance?.version === DISCLAIMER_VERSION;
}

/**
 * Un échec d'écriture ne bloque pas l'utilisateur : il entrera dans l'app et
 * reverra simplement les conditions au prochain lancement.
 */
export async function acceptDisclaimer(): Promise<DisclaimerAcceptance> {
  const acceptance: DisclaimerAcceptance = {
    version: DISCLAIMER_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(KEY_DISCLAIMER, JSON.stringify(acceptance));
  } catch {
    // Ignoré volontairement : voir commentaire ci-dessus.
  }
  return acceptance;
}

export async function resetDisclaimer(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_DISCLAIMER);
  } catch {
    // Ignoré volontairement.
  }
}
