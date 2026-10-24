import type { ArreteItem, Modalite } from '../types';

export type ChecklistPoint = {
  id: string;
  label: string;
};

export function itemNeedsAnnexeII(item: ArreteItem): boolean {
  return item.references.includes('Annexe II') || item.id === 'sex-contraception-orale';
}

export function itemNeedsArt3(item: ArreteItem): boolean {
  return item.modalite === 'renouveler' || item.modalite === 'les_deux';
}

function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function saysPrescrire(line: string): boolean {
  const text = fold(line);
  if (/^interdit\b/.test(text) || /\bne prescri/.test(text)) return false;
  if (/\bprescrire\b/.test(text)) return true;
  return /1re intention/.test(text) && !/pas de 1re|pas une 1re/.test(text);
}

function saysRenouveler(line: string): boolean {
  const text = fold(line);
  if (/^interdit\b/.test(text) || /pas un renouvel/.test(text)) return false;
  if (/\brenouvel/.test(text)) return true;
  return /pas de 1re|pas une 1re/.test(text);
}

function modaliteDejaEcrite(lines: string[], modalite: Modalite): boolean {
  const prescrit = lines.some(saysPrescrire);
  const renouvelle = lines.some(saysRenouveler);
  if (modalite === 'prescrire') return prescrit;
  if (modalite === 'renouveler') return renouvelle;
  return prescrit && renouvelle;
}

function dejaDit(lines: string[], pattern: RegExp): boolean {
  return lines.some((line) => pattern.test(fold(line)));
}

export function checklistForItem(item: ArreteItem): ChecklistPoint[] {
  // Pas de point « figure dans la liste fermée » : toute fiche de l’app en fait déjà partie.
  // Les conditions de la fiche sont les cases. Un garde-fou générique n’est ajouté
  // que s’il n’est pas déjà écrit dans les conditions ou les obligations.
  const deja = [...item.conditions, ...item.obligations];
  const points: ChecklistPoint[] = item.conditions.map((label, index) => ({
    id: `condition-${index}`,
    label,
  }));

  if (!modaliteDejaEcrite(item.conditions, item.modalite)) {
    points.push({
      id: 'modalite',
      label:
        item.modalite === 'prescrire'
          ? 'Prescription de 1re intention — pas un renouvellement hors cadre'
          : item.modalite === 'renouveler'
            ? 'Renouvellement à l’identique — pas une 1re intention'
            : 'Modalité correcte : prescrire ou renouveler, selon le cas',
    });
  }

  if (
    itemNeedsArt3(item) &&
    !dejaDit(deja, /art\. ?3|prescription initiale consultable/)
  ) {
    points.push({
      id: 'art3',
      label: 'Prescription initiale consultable par le pharmacien (Art. 3)',
    });
  }

  if (
    itemNeedsAnnexeII(item) &&
    !dejaDit(deja, /annexe ii|renouvellement infirmier/)
  ) {
    points.push({
      id: 'annexe2',
      label:
        'Mentions Annexe II sur l’ordonnance : nom, n°, « Renouvellement infirmier », durée ≤ 6 mois, date',
    });
  }

  if (!dejaDit(deja, /dossier patient|\bdmp\b/)) {
    points.push({
      id: 'tracabilite',
      label: 'Traçabilité prévue au dossier patient ou au DMP (Art. 2)',
    });
  }

  return points;
}
