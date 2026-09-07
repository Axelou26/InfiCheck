/**
 * Posologies de référence pour les antalgiques de palier I listés à l’Art. 1-V.
 * Cadre pédagogique : respecter l’AMM / notice du spécialité prescrit ;
 * ANSM pour le paracétamol (max quotidien recommandé).
 */

export type AntalgiqueId = 'paracetamol' | 'ibuprofene' | 'aspirine';

export type PatientProfil = 'adulte' | 'enfant';

export type DoseResult = {
  molecule: AntalgiqueId;
  label: string;
  profil: PatientProfil;
  poidsKg: number | null;
  doseParPrise: string;
  intervalle: string;
  maxJournalier: string;
  notes: string[];
  alertes: string[];
  resumeOrdonnance: string;
};

export type AntalgiqueMolecule = {
  id: AntalgiqueId;
  label: string;
  dci: string;
  formeTypique: string;
};

export const ANTALGIQUES_PALIER_I: AntalgiqueMolecule[] = [
  {
    id: 'paracetamol',
    label: 'Paracétamol',
    dci: 'Paracétamol',
    formeTypique: 'cp / sachet / sirop',
  },
  {
    id: 'ibuprofene',
    label: 'Ibuprofène',
    dci: 'Ibuprofène',
    formeTypique: 'cp / suspension',
  },
  {
    id: 'aspirine',
    label: 'Aspirine',
    dci: 'Acide acétylsalicylique',
    formeTypique: 'cp',
  },
];

const MIN_POIDS_ENFANT = 5;
const MAX_POIDS_ENFANT = 50;

export function isPoidsEnfantValide(kg: number): boolean {
  return Number.isFinite(kg) && kg >= MIN_POIDS_ENFANT && kg <= MAX_POIDS_ENFANT;
}

export function computeAntalgiqueDose(input: {
  molecule: AntalgiqueId;
  profil: PatientProfil;
  poidsKg?: number | null;
}): DoseResult | null {
  const mol = ANTALGIQUES_PALIER_I.find((m) => m.id === input.molecule);
  if (!mol) return null;

  if (input.profil === 'enfant') {
    const kg = input.poidsKg ?? null;
    if (kg === null || !isPoidsEnfantValide(kg)) return null;
    return doseEnfant(mol, kg);
  }

  return doseAdulte(mol);
}

function doseAdulte(mol: AntalgiqueMolecule): DoseResult {
  switch (mol.id) {
    case 'paracetamol':
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'adulte',
        poidsKg: null,
        doseParPrise: '500 mg à 1 g',
        intervalle: 'Au moins 4 h entre deux prises',
        maxJournalier: '3 g / 24 h (recommandation ANSM) — AMM jusqu’à 4 g sous surveillance',
        notes: [
          'Réserver 4 g/24 h aux situations encadrées ; préférer 3 g/24 h en pratique courante.',
          'Adapter la forme (cp, sachet, injectable hors cadre IDE si besoin) à l’AMM.',
        ],
        alertes: [
          'Insuffisance hépatique, alcoolisme chronique, dénutrition : réduire la dose / avis médical.',
          'Ne pas associer d’autres spécialités contenant du paracétamol.',
        ],
        resumeOrdonnance:
          'Paracétamol 1 g — 1 prise toutes les 6 h si besoin — sans dépasser 3 g / 24 h',
      };
    case 'ibuprofene':
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'adulte',
        poidsKg: null,
        doseParPrise: '200 à 400 mg',
        intervalle: 'Au moins 6 h entre deux prises',
        maxJournalier: '1 200 mg / 24 h (antalgie / antipyrésie en automédication)',
        notes: [
          'Prendre de préférence au cours d’un repas.',
          'Durée courte ; réévaluer si douleur persistante.',
        ],
        alertes: [
          'Contre-indiqué au 3e trimestre de grossesse, ulcère évolutif, insuffisance rénale / cardiaque / hépatique sévère.',
          'Asthme, AINS, anticoagulants : vérifier les interactions et contre-indications.',
        ],
        resumeOrdonnance:
          'Ibuprofène 400 mg — 1 prise toutes les 6 à 8 h si besoin — sans dépasser 1 200 mg / 24 h',
      };
    case 'aspirine':
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'adulte',
        poidsKg: null,
        doseParPrise: '500 mg à 1 g',
        intervalle: 'Au moins 4 h entre deux prises',
        maxJournalier: '3 g / 24 h',
        notes: [
          'Antalgie / antipyrésie palier I uniquement — pas le schéma antiagrégant.',
          'Préférer une autre molécule si risque hémorragique.',
        ],
        alertes: [
          'Contre-indiqué si ulcère, risque hémorragique, traitement anticoagulant, 3e trimestre de grossesse.',
          'Ne pas utiliser chez l’enfant / ado en contexte fébrile viral (syndrome de Reye).',
        ],
        resumeOrdonnance:
          'Acide acétylsalicylique 500 mg à 1 g — 1 prise toutes les 4 à 6 h si besoin — sans dépasser 3 g / 24 h',
      };
  }
}

function doseEnfant(mol: AntalgiqueMolecule, kg: number): DoseResult {
  const round = (n: number) => Math.round(n);

  switch (mol.id) {
    case 'paracetamol': {
      const parPrise = round(15 * kg);
      const maxJ = Math.min(round(60 * kg), 3000);
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'enfant',
        poidsKg: kg,
        doseParPrise: `${parPrise} mg (≈ 15 mg/kg)`,
        intervalle: 'Au moins 6 h entre deux prises',
        maxJournalier: `${maxJ} mg / 24 h (≈ 60 mg/kg, plafonné à 3 g)`,
        notes: [
          'Utiliser une forme pédiatrique adaptée (sirop, sachet dose-poids).',
          'Vérifier l’âge minimal et le poids sur l’AMM de la spécialité.',
        ],
        alertes: [
          'Ne pas associer d’autres produits à base de paracétamol.',
          'Insuffisance hépatique : avis médical avant prescription.',
        ],
        resumeOrdonnance: `Paracétamol ${parPrise} mg — 1 prise toutes les 6 h si besoin — max ${maxJ} mg / 24 h (poids ${kg} kg)`,
      };
    }
    case 'ibuprofene': {
      const parPrise = round(10 * kg);
      const maxJ = round(30 * kg);
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'enfant',
        poidsKg: kg,
        doseParPrise: `${parPrise} mg (≈ 10 mg/kg)`,
        intervalle: 'Au moins 6 h entre deux prises',
        maxJournalier: `${maxJ} mg / 24 h (≈ 30 mg/kg)`,
        notes: [
          'Réservé en pratique aux ≥ 6 mois selon les AMM courantes — vérifier la spécialité.',
          'Prise au cours d’un repas si possible.',
        ],
        alertes: [
          'Contre-indiqué si déshydratation, varicelle, insuffisance rénale, ulcère, 3e trimestre (patiente pubère / grossesse).',
          'Ne pas associer à un autre AINS.',
        ],
        resumeOrdonnance: `Ibuprofène ${parPrise} mg — 1 prise toutes les 6 à 8 h si besoin — max ${maxJ} mg / 24 h (poids ${kg} kg)`,
      };
    }
    case 'aspirine':
      return {
        molecule: mol.id,
        label: mol.label,
        profil: 'enfant',
        poidsKg: kg,
        doseParPrise: 'Non recommandé en pratique courante',
        intervalle: '—',
        maxJournalier: '—',
        notes: [
          'L’aspirine antalgique / antipyrétique n’est en général pas utilisée chez l’enfant.',
          'Préférer paracétamol ou ibuprofène selon l’âge et l’AMM.',
        ],
        alertes: [
          'Risque de syndrome de Reye en contexte fébrile viral — éviter chez l’enfant et l’adolescent.',
        ],
        resumeOrdonnance:
          'Acide acétylsalicylique : ne pas prescrire en antalgie / antipyrésie pédiatrique courante — choisir une autre molécule palier I',
      };
  }
}
