/** Ce qu’il faut concrètement pour rédiger une prescription IDE (hors e-prescription officielle). */

export type CommentPrescrirePoint = {
  id: string;
  title: string;
  body: string;
};

export const COMMENT_PRESCRIRE: CommentPrescrirePoint[] = [
  {
    id: 'support',
    title: 'Une feuille d’ordonnance',
    body:
      'Ordonnance papier (bloc) ou support numérique équivalent. Pas besoin d’un n° SIRET sur la feuille pour valider la prescription IDE.',
  },
  {
    id: 'identite',
    title: 'Votre identité d’exercice',
    body:
      'Nom, prénom d’exercice, et n° RPPS / n° d’enregistrement à l’Ordre (L. 4311-15). Tampon ou en-tête si vous en avez un.',
  },
  {
    id: 'patient',
    title: 'Le patient',
    body: 'Identité du patient et date de la prescription.',
  },
  {
    id: 'libelle',
    title: 'Le libellé',
    body:
      'Produit / examen clairement nommé (liste fermée de l’arrêté), quantité ou durée si prévue (ex. pansements 7 jours).',
  },
  {
    id: 'modalite',
    title: 'Prescrire ou renouveler',
    body:
      'Respecter la modalité de la fiche : 1re intention vs renouvellement à l’identique. Mentions Annexe II si contraceptifs oraux.',
  },
  {
    id: 'tracabilite',
    title: 'Traçabilité (Art. 2)',
    body: 'Inscrire la prescription au dossier patient ou au DMP.',
  },
  {
    id: 'art3',
    title: 'Si renouvellement (Art. 3)',
    body:
      'Le pharmacien doit pouvoir consulter la prescription initiale (ordonnance médicale d’origine).',
  },
];

export const COMMENT_PRESCRIRE_RESUME =
  'Feuille d’ordonnance + identité IDE (RPPS/Ordre, pas SIRET) + patient + libellé + durée/modalité + traçabilité dossier/DMP.';
