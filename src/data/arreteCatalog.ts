import catalog from '../../scripts/arrete-items.json';
import type { ArreteItem, DomaineId, DomaineMeta } from '../types';

export const ARRETE_META = {
  nor: 'SFHH2617311A',
  titre:
    "Arrêté du 26 juin 2026 fixant la liste des produits de santé et examens complémentaires que les infirmiers diplômés d'État sont autorisés à prescrire ou à renouveler",
  jo: 'Journal officiel du 27 juin 2026, texte n° 24',
  legifrance: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054321926',
  bdpm: 'https://base-donnees-publique.medicaments.gouv.fr',
  /** Incrémenter pour forcer la resync catalogue dans la DB bundlée */
  versionCatalog: '2026-08-22-all',
};

export const DOMAINES: DomaineMeta[] = [
  {
    id: 'I',
    titre: 'Vaccination',
    sousTitre: 'Calendrier, grippe, Covid-19',
    icon: 'medkit-outline',
  },
  {
    id: 'II',
    titre: 'Plaies',
    sousTitre: 'Pansements, anti-escarre, antiseptiques',
    icon: 'bandage-outline',
  },
  {
    id: 'III',
    titre: 'Santé sexuelle',
    sousTitre: 'Contraception, IST, β-HCG',
    icon: 'heart-outline',
  },
  {
    id: 'IV',
    titre: 'Sevrage tabagique',
    sousTitre: 'Substituts nicotiniques, bilan CV',
    icon: 'leaf-outline',
  },
  {
    id: 'V',
    titre: 'Produits de santé',
    sousTitre: 'Antalgiques palier I, DM, perfusion',
    icon: 'flask-outline',
  },
  {
    id: 'VI',
    titre: 'Examens biologiques',
    sousTitre: 'INR, NFS, ECBU, glycémie…',
    icon: 'water-outline',
  },
];

/** Source unique : scripts/arrete-items.json (aligné JO / Légifrance). */
export const ARRETE_ITEMS = catalog as ArreteItem[];

export function getDomaine(id: DomaineId): DomaineMeta {
  return DOMAINES.find((d) => d.id === id)!;
}
