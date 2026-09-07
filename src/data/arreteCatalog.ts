import catalog from '../../scripts/arrete-items.json';
import type { ArreteItem, DomaineId, DomaineMeta, DomaineSousGroupe } from '../types';

export const ARRETE_META = {
  nor: 'SFHH2617311A',
  titre:
    "Arrêté du 26 juin 2026 fixant la liste des produits de santé et examens complémentaires que les infirmiers diplômés d'État sont autorisés à prescrire ou à renouveler",
  jo: 'Journal officiel du 27 juin 2026, texte n° 24',
  legifrance: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054321926',
  bdpm: 'https://base-donnees-publique.medicaments.gouv.fr',
  /** Incrémenter pour forcer la resync catalogue dans la DB bundlée */
  versionCatalog: '2026-09-06-clair',
};

export const DOMAINES: DomaineMeta[] = [
  {
    id: 'I',
    titre: 'Vaccins',
    sousTitre: 'Calendrier, grippe, Covid',
    icon: 'medkit-outline',
  },
  {
    id: 'II',
    titre: 'Plaies & pansements',
    sousTitre: 'Pansements, escarres, antiseptiques',
    icon: 'bandage-outline',
  },
  {
    id: 'III',
    titre: 'Santé sexuelle',
    sousTitre: 'Contraception, IST, grossesse',
    icon: 'heart-outline',
  },
  {
    id: 'IV',
    titre: 'Arrêt du tabac',
    sousTitre: 'Patchs, gommes, bilan sanguin',
    icon: 'leaf-outline',
  },
  {
    id: 'V',
    titre: 'Douleur & matériel',
    sousTitre: 'Antidouleurs, domicile, glycémie',
    icon: 'flask-outline',
  },
  {
    id: 'VI',
    titre: 'Analyses de laboratoire',
    sousTitre: 'INR, NFS, ECBU, glycémie…',
    icon: 'water-outline',
  },
];

/**
 * Sous-groupes d’affichage uniquement — le domaine légal reste inchangé.
 * Pour V : Médicaments | DM domicile | Surveillance.
 */
export const DOMAINE_SOUS_GROUPES: Partial<Record<DomaineId, DomaineSousGroupe[]>> = {
  V: [
    {
      id: 'medicaments',
      label: 'Médicaments',
      hint: 'Palier I, adaptation douleur, solutions',
      icon: 'flask-outline',
      itemIds: ['prod-antalgiques', 'prod-adaptation-douleur', 'prod-solutions'],
    },
    {
      id: 'dm-domicile',
      label: 'DM domicile',
      hint: 'Incontinence, aides, perfusion, nutrition, contention',
      icon: 'home-outline',
      itemIds: [
        'prod-dm-incontinence',
        'prod-aides-techniques',
        'prod-perfusion',
        'prod-nutrition-enterale',
        'prod-ortheses-membres',
      ],
    },
    {
      id: 'surveillance',
      label: 'Surveillance',
      hint: 'Matériel d’autosurveillance glycémique',
      icon: 'pulse-outline',
      itemIds: ['prod-glycemie'],
    },
  ],
};

/** Source unique : scripts/arrete-items.json (aligné JO / Légifrance). */
export const ARRETE_ITEMS = catalog as ArreteItem[];

export function getDomaine(id: DomaineId): DomaineMeta {
  return DOMAINES.find((d) => d.id === id)!;
}

export function getSousGroupes(domaineId: DomaineId): DomaineSousGroupe[] | undefined {
  return DOMAINE_SOUS_GROUPES[domaineId];
}
