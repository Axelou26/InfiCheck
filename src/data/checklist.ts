import type { ArreteItem } from '../types';

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

export function checklistForItem(item: ArreteItem): ChecklistPoint[] {
  const points: ChecklistPoint[] = [
    {
      id: 'liste',
      label: 'Cette rubrique figure bien dans la liste fermée de l’arrêté',
    },
    {
      id: 'modalite',
      label:
        item.modalite === 'prescrire'
          ? 'Prescription de 1re intention — pas un renouvellement hors cadre'
          : item.modalite === 'renouveler'
            ? 'Renouvellement à l’identique — pas une 1re intention'
            : 'Modalité correcte : 1re intention ou renouvellement, selon le cas',
    },
    {
      id: 'conditions',
      label: 'Les conditions de cette fiche sont remplies (âge, durée, exclusions, formation…)',
    },
    {
      id: 'tracabilite',
      label: 'Traçabilité prévue au dossier patient ou au DMP (Art. 2)',
    },
  ];

  if (itemNeedsArt3(item)) {
    points.push({
      id: 'art3',
      label: 'Prescription initiale consultable par le pharmacien (Art. 3)',
    });
  }

  if (itemNeedsAnnexeII(item)) {
    points.push({
      id: 'annexe2',
      label:
        'Mentions Annexe II sur l’ordonnance : nom, n°, « Renouvellement infirmier », durée ≤ 6 mois, date',
    });
  }

  return points;
}
