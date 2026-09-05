export type Modalite = 'prescrire' | 'renouveler' | 'les_deux';

export type DomaineId = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type ArreteItem = {
  id: string;
  domaine: DomaineId;
  titre: string;
  description: string;
  modalite: Modalite;
  conditions: string[];
  obligations: string[];
  references: string;
  bdpmKeywords: string[];
};

export type DomaineMeta = {
  id: DomaineId;
  titre: string;
  sousTitre: string;
  icon: string;
};

/**
 * Niveau de rattachement d'une spécialité à la liste de l'arrêté.
 * `oui` : cadre clair. `conditions` : rattachée mais l'indication doit être vérifiée.
 * `non` : hors liste.
 */
export type NiveauIde = 'oui' | 'conditions' | 'non';

export type BdpmNomCommercialGroupe = {
  cis: string;
  nom: string;
  nomCommercial: string;
  typeLibelle: string;
};

export type BdpmMedicament = {
  id: string;
  cis: string;
  nom: string;
  nomCommercial: string;
  substances: string;
  resume: string;
  eligibleIde: 0 | 1;
  niveauIde: NiveauIde;
  remboursable: boolean;
  tauxRemboursement: string | null;
  itemArreteId: string | null;
  conditionsIde: string | null;
  forme?: string | null;
  voies?: string | null;
  statutAmm?: string | null;
  typeProcedure?: string | null;
  etatCommercialisation?: string | null;
  dateAmm?: string | null;
  statutBdm?: string | null;
  titulaire?: string | null;
  surveillanceRenforcee?: boolean;
  isMitm?: boolean;
  codeAtc?: string | null;
  dispoCode?: string | null;
  dispoLibelle?: string | null;
  hasInfoImportante?: boolean;
};

export type BdpmPresentation = {
  cip7: string;
  cip13: string;
  libelle: string;
  statut: string;
  etatCommercialisation: string;
  dateCommercialisation: string;
  agrementCollectivites: string;
  tauxRemboursement: string;
  prix: string;
  indicationsRemboursement: string;
};

export type BdpmComposition = {
  elementPharma: string;
  codeSubstance: string;
  substance: string;
  dosage: string;
  refDosage: string;
  nature: string;
};

export type BdpmAvisHas = {
  codeHas: string;
  motif: string;
  dateAvis: string;
  valeur: string;
  libelle: string;
  url: string;
};

export type BdpmGenerique = {
  groupeId: string;
  libelle: string;
  typeLibelle: string;
};

export type BdpmRupture = {
  cip: string;
  codeStatut: string;
  libelleStatut: string;
  dateDebut: string;
  dateMaj: string;
  dateRemise: string;
  url: string;
};

export type BdpmInfoImportante = {
  dateDebut: string;
  dateFin: string;
  texte: string;
};

export type BdpmMedicamentDetail = BdpmMedicament & {
  presentations: BdpmPresentation[];
  compositions: BdpmComposition[];
  conditionsDelivrance: string[];
  generiques: BdpmGenerique[];
  avisSmr: BdpmAvisHas[];
  avisAsmr: BdpmAvisHas[];
  ruptures: BdpmRupture[];
  infosImportantes: BdpmInfoImportante[];
  nomsCommerciauxGroupe: BdpmNomCommercialGroupe[];
  ficheBdpmUrl: string;
};

export type MetaRow = {
  key: string;
  value: string;
};
