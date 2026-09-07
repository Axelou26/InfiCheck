import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type GuideSituation = {
  id: string;
  label: string;
  hint?: string;
  icon?: IconName;
};

export type GuideSuggestion = {
  titre: string;
  resume: string;
  libelles: string[];
  duree?: string;
  notes: string[];
  alertes: string[];
  /** Si false : hors cadre / ne pas prescrire au titre de cette fiche. */
  autorise?: boolean;
};

export type PrescriptionGuide = {
  itemId: string;
  titre: string;
  sousTitre: string;
  question: string;
  situations: GuideSituation[];
  resolve: (situationId: string) => GuideSuggestion;
};

const DUREE_PANSEMENTS = 'Durée initiale : 7 jours (Art. 1-II) — au-delà, suivi médical.';

export const GUIDE_PANSEMENTS: PrescriptionGuide = {
  itemId: 'plaie-pansements',
  titre: 'Guide pansements',
  sousTitre: 'Selon l’aspect et l’exsudat de la plaie',
  question: 'Quel est le profil de la plaie ?',
  situations: [
    {
      id: 'simple',
      label: 'Plaie simple / fermeture',
      hint: 'Peu ou pas d’exsudat, protection',
      icon: 'bandage-outline',
    },
    {
      id: 'seche',
      label: 'Sèche / peu exsudative',
      hint: 'Maintenir un milieu humide',
      icon: 'water-outline',
    },
    {
      id: 'exsudative',
      label: 'Exsudative / productive',
      hint: 'Absorption élevée',
      icon: 'rainy-outline',
    },
    {
      id: 'necrose',
      label: 'Nécrose / fibrine',
      hint: 'Hydratation / détersion',
      icon: 'flame-outline',
    },
    {
      id: 'odeur',
      label: 'Malodorante',
      hint: 'Contrôle des odeurs',
      icon: 'alert-circle-outline',
    },
    {
      id: 'critique',
      label: 'Signes locaux critiques',
      hint: 'Suspicion colonisation / infection locale',
      icon: 'warning-outline',
    },
    {
      id: 'hemorragique',
      label: 'Saignement local',
      hint: 'Hémostase locale',
      icon: 'fitness-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'simple':
        return {
          titre: 'Protection / plaie peu complexe',
          resume: 'Pansement adhésif ou compresses + contention légère, durée 7 jours.',
          libelles: [
            'Pansements adhésifs stériles avec compresse intégrée — durée initiale 7 jours',
            'Compresses stériles de coton hydrophile (adhésives ou non adhérentes)',
            'Films adhésifs semi-perméables, filets / jerseys tubulaires',
            'Sparadraps, bandes de crêpe / extensibles, sets pour plaies',
          ],
          duree: DUREE_PANSEMENTS,
          notes: [
            'Adapter la taille au pourtour de la plaie.',
            'Prévoir suffisamment de renouvellements sur 7 jours selon le rythme de soins.',
          ],
          alertes: [],
        };
      case 'seche':
        return {
          titre: 'Milieu humide — peu d’exsudat',
          resume: 'Hydrocolloïde, interface ou hydrogel selon besoin d’hydratation.',
          libelles: [
            'Pansements hydrocolloïdes',
            'Pansements interfaces (silicone / CMC)',
            'Pansements hydrogels',
            'Pansements à l’acide hyaluronique',
            'Pansements vaselinés / irrigo-absorbants',
          ],
          duree: DUREE_PANSEMENTS,
          notes: [
            'Éviter un pansement trop absorbant sur une plaie sèche (risque d’assèchement).',
          ],
          alertes: [],
        };
      case 'exsudative':
        return {
          titre: 'Fort pouvoir d’absorption',
          resume: 'Alginate, hydrofibre, hydrocellulaire ou super-absorbant.',
          libelles: [
            'Pansements / compresses absorbants non adhérents pour plaies productives',
            'Pansements alginates',
            'Pansements hydrofibres / fibres à haut pouvoir d’absorption',
            'Pansements hydrocellulaires',
            'Pansements super-absorbants',
          ],
          duree: DUREE_PANSEMENTS,
          notes: [
            'Protéger la peau péri-lésionnelle (spray protecteur si besoin — fiche dédiée).',
            'Renouveler selon saturation du pansement.',
          ],
          alertes: [],
        };
      case 'necrose':
        return {
          titre: 'Hydratation et aide à la détersion',
          resume: 'Hydrogel ± matériel de détersion ; réévaluer rapidement.',
          libelles: [
            'Pansements hydrogels',
            'Matériel d’aide à la détersion',
            'Pansements interfaces (silicone / CMC)',
          ],
          duree: DUREE_PANSEMENTS,
          notes: [
            'La détersion mécanique reste un acte de soin — ce guide ne couvre que la prescription de DM.',
          ],
          alertes: [
            'Escarre stade avancé, pied diabétique, signes généraux : avis médical sans délai.',
          ],
        };
      case 'odeur':
        return {
          titre: 'Contrôle des odeurs',
          resume: 'Pansement au charbon actif, souvent associé à un absorbant.',
          libelles: [
            'Pansements à base de charbon actif',
            'Pansements hydrocellulaires',
            'Pansements super-absorbants',
          ],
          duree: DUREE_PANSEMENTS,
          notes: ['Traiter aussi la cause (exsudat, colonisation) — ne pas se limiter à l’odeur.'],
          alertes: [],
        };
      case 'critique':
        return {
          titre: 'Suspicion de colonisation / infection locale',
          resume: 'Pansement à l’argent possible ; surveillance clinique étroite.',
          libelles: [
            'Pansements à l’argent',
            'Pansements hydrofibres / fibres à haut pouvoir d’absorption',
            'Pansements alginates',
          ],
          duree: DUREE_PANSEMENTS,
          notes: [
            'L’argent n’est pas un antibiotique systémique — réévaluer à 7 jours.',
            'Antiseptique large spectre : uniquement si brûlure / traumatisme souillé ≤ 5 j (fiche dédiée).',
          ],
          alertes: [
            'Fièvre, lymphangite, pied diabétique, plaie profonde : ne pas se limiter à un pansement — avis médical.',
          ],
        };
      case 'hemorragique':
        return {
          titre: 'Hémostase locale',
          resume: 'Compresse hémostatique / collagène + compression.',
          libelles: [
            'Produits hémostatiques (compresses de collagène)',
            'Compresses stériles non tissées / gaze hydrophile',
            'Champ stérile / dispositifs de rapprochement cutané adhésifs',
          ],
          duree: DUREE_PANSEMENTS,
          notes: ['Surveiller la reprise du saignement après le soin.'],
          alertes: [
            'Saignement abondant, trouble de coagulation, anticoagulant : urgence / avis médical.',
          ],
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_SUPPORTS: PrescriptionGuide = {
  itemId: 'plaie-supports',
  titre: 'Guide supports anti-escarre',
  sousTitre: 'Selon le risque ou le stade',
  question: 'Quel est le niveau de risque / le besoin ?',
  situations: [
    {
      id: 'prevention-moderee',
      label: 'Prévention — risque modéré',
      hint: 'Mobilité réduite, pas d’escarre',
      icon: 'shield-outline',
    },
    {
      id: 'prevention-elevee',
      label: 'Prévention — risque élevé',
      hint: 'Alité, dénutri, antécédent d’escarre',
      icon: 'shield-checkmark-outline',
    },
    {
      id: 'escarre',
      label: 'Escarre constituée',
      hint: 'Traitement d’appui',
      icon: 'medkit-outline',
    },
    {
      id: 'assise',
      label: 'Fauteuil / assise',
      hint: 'Pression au siège',
      icon: 'tablet-landscape-outline',
    },
    {
      id: 'positionnement',
      label: 'Positionnement',
      hint: 'Cales, décharges localisées',
      icon: 'move-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'prevention-moderee':
        return {
          titre: 'Sur-matelas / mousse',
          resume: 'Support statique adapté à la prévention.',
          libelles: [
            'Sur-matelas anti-escarre en mousse viscoélastique',
            'Sur-matelas anti-escarre en gel ou mousse et gel',
            'Sur-matelas à modules amovibles / découpe gaufrier',
            'Matelas / sur-matelas anti-escarre à air statique',
          ],
          notes: [
            'Associer toujours à la mobilisation et à la surveillance cutanée.',
            'Liste fermée Art. 1-II-a : ne pas prescrire un support hors types prévus.',
          ],
          alertes: [],
        };
      case 'prevention-elevee':
        return {
          titre: 'Air dynamique ou support haute performance',
          resume: 'Privilégier l’air dynamique si risque très élevé.',
          libelles: [
            'Matelas d’aide à la prévention / traitement d’escarre à air dynamique',
            'Matelas / sur-matelas anti-escarre à air statique',
            'Sur-matelas anti-escarre en mousse viscoélastique',
          ],
          notes: ['Vérifier la compatibilité lit / matelas et la formation de l’aidant au réglage.'],
          alertes: [],
        };
      case 'escarre':
        return {
          titre: 'Traitement d’appui',
          resume: 'Air dynamique en 1re intention pour décharge.',
          libelles: [
            'Matelas d’aide à la prévention / traitement d’escarre à air dynamique',
            'Coussin anti-escarre (air, gel ou mousse)',
            'Cales de positionnement anti-escarre',
          ],
          notes: ['Le support ne remplace pas le pansement ni le suivi médical de l’escarre.'],
          alertes: [
            'Escarre stade III–IV, infection, exposition osseuse : coordination médicale urgente.',
          ],
        };
      case 'assise':
        return {
          titre: 'Décharge au fauteuil',
          resume: 'Coussin anti-escarre adapté à l’assise.',
          libelles: [
            'Coussin anti-escarre (air, gel ou mousse)',
            'Cales de positionnement anti-escarre',
          ],
          notes: ['Alterner les appuis ; surveiller les ischions et le sacrum.'],
          alertes: [],
        };
      case 'positionnement':
        return {
          titre: 'Cales et modules',
          resume: 'Positionnement et décharges localisées.',
          libelles: [
            'Cales de positionnement anti-escarre',
            'Sur-matelas à modules amovibles / découpe gaufrier',
          ],
          notes: ['Éviter les points de cisaillement lors des transferts.'],
          alertes: [],
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_ANTISEPTIQUES: PrescriptionGuide = {
  itemId: 'plaie-antiseptiques',
  titre: 'Cadre antiseptiques (plaie)',
  sousTitre: 'Vérifier si la prescription est autorisée',
  question: 'Quelle est la situation clinique ?',
  situations: [
    {
      id: 'brulure-recente',
      label: 'Brûlure ≤ 5 jours',
      hint: 'Plaie récente par brûlure',
      icon: 'flame-outline',
    },
    {
      id: 'traumatisme-souille',
      label: 'Traumatisme souillé ≤ 5 j',
      hint: 'Plaie traumatique avec souillures',
      icon: 'alert-outline',
    },
    {
      id: 'pied-diabetique',
      label: 'Pied diabétique',
      hint: 'Exclusion de l’arrêté',
      icon: 'close-circle-outline',
    },
    {
      id: 'autre',
      label: 'Autre plaie / > 5 jours',
      hint: 'Hors cadre Art. 1-II-c',
      icon: 'remove-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'brulure-recente':
      case 'traumatisme-souille':
        return {
          titre: 'Cadre autorisé',
          resume: 'Antiseptique à large spectre, sans antibiotique, dans les 5 premiers jours.',
          libelles: [
            'Antiseptique à large spectre — sans antibiotique',
            situationId === 'brulure-recente'
              ? 'Indication : plaie par brûlure — ≤ 5 jours après apparition'
              : 'Indication : plaie traumatique avec souillures — ≤ 5 jours après apparition',
          ],
          notes: [
            'Pas de produit contenant un antibiotique.',
            'Au-delà de 5 jours : ne plus prescrire au titre de cet alinéa.',
          ],
          alertes: [],
          autorise: true,
        };
      case 'pied-diabetique':
        return {
          titre: 'Hors cadre — interdit',
          resume: 'L’arrêté exclut explicitement la plaie du pied diabétique.',
          libelles: [],
          notes: [
            'Pour un antiseptique hors ce cadre plaie : voir « Solutions stériles et antiseptiques » (Art. 1-V).',
          ],
          alertes: [
            'Ne pas prescrire d’antiseptique au titre de l’Art. 1-II-c sur un pied diabétique.',
          ],
          autorise: false,
        };
      case 'autre':
        return {
          titre: 'Hors cadre Art. 1-II-c',
          resume: 'Ni brûlure ni traumatisme souillé ≤ 5 jours : cet alinéa ne s’applique pas.',
          libelles: [],
          notes: [
            'Orienter vers pansements (Art. 1-II) et/ou solutions stériles / antiseptiques (Art. 1-V).',
          ],
          alertes: ['Ne pas forcer une prescription antiseptique hors conditions de l’arrêté.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_NICOTINE: PrescriptionGuide = {
  itemId: 'tabac-substituts',
  titre: 'Guide substituts nicotiniques',
  sousTitre: 'Selon l’intensité de la dépendance',
  question: 'Quelle est l’intensité estimée de la dépendance ?',
  situations: [
    {
      id: 'legere',
      label: 'Légère',
      hint: '≤ 10 cig./j ou 1re cigarette tardive',
      icon: 'leaf-outline',
    },
    {
      id: 'moderee',
      label: 'Modérée',
      hint: '10–20 cig./j',
      icon: 'thermometer-outline',
    },
    {
      id: 'forte',
      label: 'Forte',
      hint: '> 20 cig./j ou 1re cigarette rapide',
      icon: 'flash-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'legere':
        return {
          titre: 'Formes orales en 1re intention',
          resume: 'Gommes, pastilles ou spray selon préférence du patient.',
          libelles: [
            'Substitut nicotinique — gommes à mâcher',
            'Substitut nicotinique — pastilles / comprimés à sucer',
            'Substitut nicotinique — inhalateur / spray buccal',
          ],
          notes: [
            'Adapter le dosage de la spécialité à l’AMM et à la consommation.',
            'Possibilité d’associer une forme orale à un patch si besoin.',
          ],
          alertes: [],
        };
      case 'moderee':
        return {
          titre: 'Patch ± forme orale de secours',
          resume: 'Couverture de fond par patch, formes orales pour les envies.',
          libelles: [
            'Substitut nicotinique — dispositif transdermique (patch)',
            'Substitut nicotinique — gommes à mâcher',
            'Substitut nicotinique — pastilles / comprimés à sucer',
            'Substitut nicotinique — inhalateur / spray buccal',
          ],
          notes: [
            'Choisir le dosage de patch selon l’AMM et le nombre de cigarettes.',
            'Expliquer le rythme de réduction progressive.',
          ],
          alertes: [],
        };
      case 'forte':
        return {
          titre: 'Patch dosage élevé + formes orales',
          resume: 'Association souvent utile ; réévaluer rapidement.',
          libelles: [
            'Substitut nicotinique — dispositif transdermique (patch)',
            'Substitut nicotinique — gommes à mâcher',
            'Substitut nicotinique — pastilles / comprimés à sucer',
            'Substitut nicotinique — inhalateur / spray buccal',
          ],
          notes: [
            'Vérifier les contre-indications / précautions de la spécialité (pathologie CV récente…).',
            'Bilan facteurs de risque CV possible (fiche Art. 1-IV dédiée).',
          ],
          alertes: [
            'Pathologie cardiovasculaire instable récente : avis médical avant initiation.',
          ],
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_CONTENTION: PrescriptionGuide = {
  itemId: 'plaie-contention',
  titre: 'Guide contention (cadre plaie)',
  sousTitre: 'Choisir la forme — force à l’identique',
  question: 'Quelle forme de contention ?',
  situations: [
    {
      id: 'bas',
      label: 'Bas',
      hint: 'Force de compression à l’identique',
      icon: 'footsteps-outline',
    },
    {
      id: 'collants',
      label: 'Collants',
      hint: 'Force à l’identique',
      icon: 'body-outline',
    },
    {
      id: 'chaussettes',
      label: 'Chaussettes',
      hint: 'Force à l’identique',
      icon: 'walk-outline',
    },
    {
      id: 'bandes',
      label: 'Bandes',
      hint: 'Force à l’identique',
      icon: 'bandage-outline',
    },
  ],
  resolve(situationId) {
    const map: Record<string, string> = {
      bas: 'Bas de contention — force de compression à l’identique',
      collants: 'Collants de contention — force à l’identique',
      chaussettes: 'Chaussettes de contention — force à l’identique',
      bandes: 'Bandes de contention — force à l’identique',
    };
    const libelle = map[situationId];
    if (!libelle) return emptySuggestion();
    return {
      titre: 'Cadre plaie uniquement',
      resume: 'Toujours à l’identique de la force — ne pas changer de classe.',
      libelles: [libelle],
      notes: [
        'Uniquement dans le cadre de la prévention ou du traitement de la plaie.',
        'Hors plaie : voir « Orthèses élastiques de contention (membres) » — renouvellement à l’identique, sans collants ni bandes.',
      ],
      alertes: ['Ne pas augmenter la classe de compression au titre de cet alinéa.'],
    };
  },
};

export const GUIDE_INCONTINENCE: PrescriptionGuide = {
  itemId: 'prod-dm-incontinence',
  titre: 'Guide incontinence / stomies',
  sousTitre: 'Selon le besoin urogénital ou de stomie',
  question: 'Quel est le besoin principal ?',
  situations: [
    {
      id: 'etui',
      label: 'Étui pénien',
      hint: 'Incontinence urinaire masculine',
      icon: 'man-outline',
    },
    {
      id: 'collecte',
      label: 'Collecte / urinal',
      hint: 'Plat bassin, urinal',
      icon: 'beaker-outline',
    },
    {
      id: 'stomie',
      label: 'Stomie / poches',
      hint: 'Poches et accessoires',
      icon: 'ellipse-outline',
    },
    {
      id: 'fecal',
      label: 'Incontinence fécale',
      hint: 'Tampon, collecteur, irrigation',
      icon: 'git-commit-outline',
    },
    {
      id: 'autosondage',
      label: 'Auto / hétérosondage',
      hint: 'Sondes intermittentes',
      icon: 'git-branch-outline',
    },
    {
      id: 'demeure',
      label: 'Sonde à demeure',
      hint: 'Renouvellement uniquement',
      icon: 'refresh-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'etui':
        return {
          titre: 'Étui pénien et raccords',
          resume: 'Prescription ou renouvellement du système complet.',
          libelles: ['Étui pénien + joint + raccord'],
          notes: ['Adapter la taille ; surveiller la peau du gland et du sillon.'],
          alertes: [],
        };
      case 'collecte':
        return {
          titre: 'Matériel de collecte',
          resume: 'Plat bassin / urinal selon autonomie.',
          libelles: ['Plat bassin / urinal'],
          notes: [],
          alertes: [],
        };
      case 'stomie':
        return {
          titre: 'Poches et accessoires de stomie',
          resume: 'Poches + supports / ceinture / clamp / pâte selon le besoin.',
          libelles: [
            'Poches pour incontinent / stomisé (+ supports, ceinture, clamp…)',
            'Pâte péristomiale / tampon absorbant selon besoin',
          ],
          notes: [
            'Renouvellement à l’identique si déjà équipé : prescription initiale consultable (Art. 3).',
          ],
          alertes: [],
        };
      case 'fecal':
        return {
          titre: 'Incontinence fécale / irrigation',
          resume: 'Tampon, bouchon, collecteur ou nécessaire d’irrigation colique.',
          libelles: [
            'Tampon / bouchon de matières fécales / collecteur',
            'Nécessaire pour irrigation colique',
          ],
          notes: [],
          alertes: [],
        };
      case 'autosondage':
        return {
          titre: 'Sondage intermittent',
          resume: 'Sondes pour autosondage ou hétérosondage — 1re intention ou renouvellement.',
          libelles: ['Sondes vésicales pour autosondage / hétérosondage'],
          notes: ['La technique de sondage est un acte de soin, distinct de la prescription du DM.'],
          alertes: [],
        };
      case 'demeure':
        return {
          titre: 'Sonde à demeure — renouvellement seul',
          resume: 'Pas de 1re prescription au titre de cet alinéa.',
          libelles: ['Sonde vésicale à demeure — renouvellement uniquement'],
          notes: ['Le pharmacien doit pouvoir consulter la prescription initiale (Art. 3).'],
          alertes: [
            'Interdit : première mise en place d’une sonde à demeure au titre de cet alinéa.',
          ],
          autorise: true,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_PERFUSION: PrescriptionGuide = {
  itemId: 'prod-perfusion',
  titre: 'Guide perfusion à domicile',
  sousTitre: 'Selon la voie d’accès déjà en place',
  question: 'Quelle est la situation de perfusion ?',
  situations: [
    {
      id: 'appareil',
      label: 'Appareil / perfuseur',
      hint: 'Matériel de base domicile',
      icon: 'hardware-chip-outline',
    },
    {
      id: 'bras',
      label: 'Voie périphérique (bras)',
      hint: 'Sans cathéter implantable',
      icon: 'hand-left-outline',
    },
    {
      id: 'cci',
      label: 'CCI déjà en place',
      hint: 'Chambre implantable',
      icon: 'radio-button-on-outline',
    },
    {
      id: 'picc',
      label: 'PICC / cathéter central',
      hint: 'Déjà en place',
      icon: 'git-network-outline',
    },
    {
      id: 'entretien',
      label: 'Entretien / rinçage',
      hint: 'Héparinisation, rinçage',
      icon: 'water-outline',
    },
    {
      id: 'potence',
      label: 'Pied / potence',
      hint: 'Support à sérum',
      icon: 'trail-sign-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'appareil':
        return {
          titre: 'Appareils et remplissage',
          resume: 'Perfuseur / diffuseur et accessoires de remplissage.',
          libelles: [
            'Appareil à perfusion stérile non réutilisable — perfusion à domicile',
            'Perfuseur de précision / panier de perfusion',
            'Accessoires à usage unique de remplissage (perfuseur / diffuseur portable)',
          ],
          notes: [
            'Le produit perfusé n’est autorisé que s’il figure ailleurs dans la liste (ex. palier I).',
          ],
          alertes: [],
        };
      case 'bras':
        return {
          titre: 'Pose au bras — sans CCI',
          resume: 'Accessoires à usage unique uniquement s’il n’y a pas de cathéter implantable.',
          libelles: [
            'Accessoires pose au bras — uniquement sans cathéter implantable',
            'Prolongateur / robinet 3 voies / adhésif transparent',
          ],
          notes: [],
          alertes: [
            'Si CCI / PICC / cathéter central déjà en place : utiliser les libellés dédiés, pas ceux « pose au bras ».',
          ],
        };
      case 'cci':
        return {
          titre: 'Chambre implantable déjà en place',
          resume: 'Aiguilles de CCI et maintien — pas la pose de l’implant.',
          libelles: [
            'Aiguilles de chambre à cathéter implantable (CCI déjà en place)',
            'Pansements de maintien de cathéter central / PICC déjà en place',
            'Prolongateur / robinet 3 voies / adhésif transparent',
          ],
          notes: ['Vous ne prescrivez pas l’implant (CCI) lui-même.'],
          alertes: ['La pose de CCI est un acte distinct — hors prescription de ce matériel.'],
        };
      case 'picc':
        return {
          titre: 'PICC / cathéter central déjà en place',
          resume: 'Maintien et accessoires — pas le cathéter lui-même.',
          libelles: [
            'Pansements de maintien de cathéter central / PICC déjà en place',
            'Prolongateur / robinet 3 voies / adhésif transparent',
            'Aiguille, adhésif transparent, prolongateur, robinet 3 voies',
          ],
          notes: ['Vous ne prescrivez pas le cathéter central / PICC lui-même.'],
          alertes: [],
        };
      case 'entretien':
        return {
          titre: 'Entretien, rinçage, héparinisation',
          resume: 'Accessoires stériles non réutilisables adaptés.',
          libelles: [
            'Seringues ou aiguilles pour entretien / rinçage / héparinisation (stériles, non réutilisables)',
            'Prolongateur / robinet 3 voies / adhésif transparent',
          ],
          notes: [],
          alertes: [],
        };
      case 'potence':
        return {
          titre: 'Support de perfusion',
          resume: 'Pied ou potence à sérum à roulettes.',
          libelles: ['Pied / potence à sérum à roulettes'],
          notes: [],
          alertes: [],
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_NUTRITION: PrescriptionGuide = {
  itemId: 'prod-nutrition-enterale',
  titre: 'Guide nutrition entérale',
  sousTitre: 'Sonde vs renouvellement du matériel',
  question: 'Que devez-vous faire ?',
  situations: [
    {
      id: 'sonde-ng',
      label: '1re sonde naso-gastrique',
      hint: 'Prescription de 1re intention',
      icon: 'add-circle-outline',
    },
    {
      id: 'sonde-ne',
      label: '1re sonde naso-entérale',
      hint: 'Prescription de 1re intention',
      icon: 'add-outline',
    },
    {
      id: 'renouveler-sonde',
      label: 'Renouveler la sonde',
      hint: 'À l’identique',
      icon: 'refresh-outline',
    },
    {
      id: 'accessoires',
      label: 'Tubulures / accessoires',
      hint: 'Renouvellement uniquement',
      icon: 'git-merge-outline',
    },
    {
      id: 'nutriment',
      label: 'Produit nutritif',
      hint: 'Hors liste',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'sonde-ng':
        return {
          titre: 'Sonde naso-gastrique',
          resume: 'Seule la sonde est prescritible en 1re intention.',
          libelles: ['Sonde naso-gastrique pour nutrition entérale à domicile'],
          notes: [
            'La pose de la sonde est un acte de soin (arrêté actes), distinct de cette prescription.',
          ],
          alertes: [],
        };
      case 'sonde-ne':
        return {
          titre: 'Sonde naso-entérale',
          resume: 'Seule la sonde est prescritible en 1re intention.',
          libelles: ['Sonde naso-entérale pour nutrition entérale à domicile'],
          notes: [
            'La pose de la sonde est un acte de soin (arrêté actes), distinct de cette prescription.',
          ],
          alertes: [],
        };
      case 'renouveler-sonde':
        return {
          titre: 'Renouvellement de sonde',
          resume: 'Renouveler la sonde déjà prévue.',
          libelles: [
            'Sonde naso-gastrique pour nutrition entérale à domicile',
            'Sonde naso-entérale pour nutrition entérale à domicile',
          ],
          notes: ['Prescription initiale consultable si renouvellement à l’identique (Art. 3).'],
          alertes: [],
        };
      case 'accessoires':
        return {
          titre: 'Matériel de nutrition — renouvellement',
          resume: 'Tubulures / accessoires : pas de 1re prescription hors sonde.',
          libelles: [
            'Renouvellement du matériel de nutrition entérale (tubulures / accessoires) — pas de 1re prescription du matériel hors sonde',
          ],
          notes: [],
          alertes: [
            'Interdit : 1re prescription du matériel de nutrition (hors la sonde) au titre de cet alinéa.',
          ],
        };
      case 'nutriment':
        return {
          titre: 'Hors liste',
          resume: 'Le mélange / produit nutritif n’est pas dans la liste de l’arrêté.',
          libelles: [],
          notes: ['L’IDE ne prescrit pas le produit nutritif au titre de cet alinéa.'],
          alertes: ['Ne pas prescrire le nutriment — hors liste fermée.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_GLYCEMIE_DM: PrescriptionGuide = {
  itemId: 'prod-glycemie',
  titre: 'Guide matériel glycémique',
  sousTitre: 'Renouvellement à l’identique uniquement',
  question: 'Quel matériel renouveler (à l’identique) ?',
  situations: [
    {
      id: 'bandelettes',
      label: 'Bandelettes',
      hint: 'Autosurveillance capillaire',
      icon: 'analytics-outline',
    },
    {
      id: 'piqure',
      label: 'Lancettes / autopiqueur',
      hint: 'Usage unique',
      icon: 'ellipse-outline',
    },
    {
      id: 'injection',
      label: 'Aiguilles / seringues',
      hint: 'Stylo ou seringue',
      icon: 'eyedrop-outline',
    },
    {
      id: 'capteur',
      label: 'Capteur / lecteur',
      hint: 'Glucose interstitiel',
      icon: 'watch-outline',
    },
    {
      id: 'premiere',
      label: '1re mise sous système',
      hint: 'Hors cadre',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'bandelettes':
        return {
          titre: 'Bandelettes — à l’identique',
          resume: 'Même type que la prescription médicale initiale.',
          libelles: [
            'Bandelettes d’autosurveillance glycémique — renouvellement à l’identique',
          ],
          notes: ['Prescription initiale consultable par le pharmacien (Art. 3).'],
          alertes: [],
        };
      case 'piqure':
        return {
          titre: 'Lancettes / autopiqueurs',
          resume: 'Renouvellement à usage unique, à l’identique.',
          libelles: ['Lancettes / autopiqueurs à usage unique — renouvellement'],
          notes: [],
          alertes: [],
        };
      case 'injection':
        return {
          titre: 'Consommables d’injection',
          resume: 'Seringues / aiguilles de stylo — à l’identique.',
          libelles: ['Seringues / aiguilles pour stylo injecteur — renouvellement'],
          notes: [],
          alertes: [],
        };
      case 'capteur':
        return {
          titre: 'Capteur / lecteur interstitiel',
          resume: 'Même système que l’ordonnance initiale — pas de bascule de technologie.',
          libelles: [
            'Capteur / lecteur de glucose interstitiel — renouvellement à l’identique',
          ],
          notes: [],
          alertes: [
            'Interdit : passer d’un lecteur à un capteur (ou l’inverse) si ce n’est pas à l’identique.',
          ],
        };
      case 'premiere':
        return {
          titre: 'Hors cadre',
          resume: 'Pas de 1re mise sous lecteur / capteur au titre de cet alinéa.',
          libelles: [],
          notes: ['Orienter vers le médecin pour l’initiation du système.'],
          alertes: ['Interdit : 1re prescription de matériel glycémique au titre de cet alinéa.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_ADAPTATION_DOULEUR: PrescriptionGuide = {
  itemId: 'prod-adaptation-douleur',
  titre: 'Cadre adaptation posologie',
  sousTitre: 'Uniquement selon l’ordonnance initiale',
  question: 'Quelle est votre intention ?',
  situations: [
    {
      id: 'dans-bornes',
      label: 'Ajuster dans les bornes',
      hint: 'Doses / rythme déjà prévus',
      icon: 'options-outline',
    },
    {
      id: 'nouvelle-molecule',
      label: 'Changer de molécule',
      hint: 'Hors cadre',
      icon: 'swap-horizontal-outline',
    },
    {
      id: 'hors-bornes',
      label: 'Sortir des bornes',
      hint: 'Dose ou rythme non prévus',
      icon: 'warning-outline',
    },
    {
      id: 'hors-douleur',
      label: 'Hors douleur',
      hint: 'Autre indication',
      icon: 'close-circle-outline',
    },
    {
      id: 'premiere',
      label: '1re prescription',
      hint: 'Pas d’ordonnance initiale',
      icon: 'add-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'dans-bornes':
        return {
          titre: 'Adaptation autorisée',
          resume:
            'Vous adaptez uniquement selon les indications déjà écrites sur l’ordonnance initiale, dans le domaine douleur.',
          libelles: [
            'Adaptation de posologie antalgique selon la prescription médicale initiale',
          ],
          notes: [
            'S’appuyer sur la prescription médicale initiale (Art. 3 si renouvellement à l’identique).',
            'Pour une 1re prescription de palier I : fiche « Antalgiques de palier I ».',
          ],
          alertes: [],
          autorise: true,
        };
      case 'nouvelle-molecule':
        return {
          titre: 'Hors cadre',
          resume: 'Changer de molécule n’est pas une adaptation de posologie.',
          libelles: [],
          notes: ['Si palier I en 1re intention : voir la fiche antalgiques.'],
          alertes: ['Interdit : changer de molécule au titre de cet alinéa.'],
          autorise: false,
        };
      case 'hors-bornes':
        return {
          titre: 'Hors cadre',
          resume: 'Les doses ou le rythme doivent rester dans les bornes du prescripteur initial.',
          libelles: [],
          notes: [],
          alertes: [
            'Interdit : sortir des bornes (doses, rythme) prévues par le prescripteur initial.',
          ],
          autorise: false,
        };
      case 'hors-douleur':
        return {
          titre: 'Hors cadre',
          resume: 'Cet alinéa est limité à la prise en charge de la douleur.',
          libelles: [],
          notes: [],
          alertes: ['Interdit : adapter une posologie hors indication douleur.'],
          autorise: false,
        };
      case 'premiere':
        return {
          titre: 'Hors cadre',
          resume: 'Pas une 1re prescription d’un nouveau médicament.',
          libelles: [],
          notes: ['Sans ordonnance initiale douleur : ne pas utiliser cet alinéa.'],
          alertes: ['Interdit : 1re prescription au titre de « adaptation de posologie ».'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_ORTHÈSES: PrescriptionGuide = {
  itemId: 'prod-ortheses-membres',
  titre: 'Guide orthèses de contention',
  sousTitre: 'Renouvellement à l’identique — hors cadre plaie',
  question: 'Que renouveler (à l’identique) ?',
  situations: [
    {
      id: 'bas-jambe',
      label: 'Bas jambe',
      hint: 'Même type et force',
      icon: 'walk-outline',
    },
    {
      id: 'bas-cuisse',
      label: 'Bas cuisse',
      hint: 'Même type et force',
      icon: 'body-outline',
    },
    {
      id: 'chaussettes',
      label: 'Chaussettes + suppléments',
      hint: 'À l’identique',
      icon: 'footsteps-outline',
    },
    {
      id: 'collants-bandes',
      label: 'Collants / bandes',
      hint: 'Pas ici — cadre plaie',
      icon: 'swap-horizontal-outline',
    },
    {
      id: 'premiere',
      label: '1re prescription',
      hint: 'Hors cadre',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'bas-jambe':
        return {
          titre: 'Bas jambe — à l’identique',
          resume: 'Même type, même force que l’ordonnance initiale.',
          libelles: ['Bas de contention jambe — renouvellement à l’identique'],
          notes: ['Prescription initiale consultable (Art. 3).'],
          alertes: [],
        };
      case 'bas-cuisse':
        return {
          titre: 'Bas cuisse — à l’identique',
          resume: 'Même type, même force que l’ordonnance initiale.',
          libelles: ['Bas de contention cuisse — renouvellement à l’identique'],
          notes: ['Prescription initiale consultable (Art. 3).'],
          alertes: [],
        };
      case 'chaussettes':
        return {
          titre: 'Chaussettes et suppléments',
          resume: 'Renouvellement à l’identique uniquement.',
          libelles: [
            'Chaussettes de contention + suppléments associés — renouvellement à l’identique',
          ],
          notes: [],
          alertes: [],
        };
      case 'collants-bandes':
        return {
          titre: 'Orienter vers le cadre plaie',
          resume: 'Collants et bandes ne sont pas dans cet alinéa.',
          libelles: [],
          notes: [
            'Collants / bandes : fiche « Contention (cadre plaie) » — force de compression à l’identique.',
          ],
          alertes: [
            'Ne pas renouveler collants ni bandes au titre des orthèses de membres (Art. 1-V-3-g).',
          ],
          autorise: false,
        };
      case 'premiere':
        return {
          titre: 'Hors cadre',
          resume: 'Pas de 1re prescription au titre de cet alinéa.',
          libelles: [],
          notes: [],
          alertes: ['Interdit : 1re prescription d’orthèses de contention au titre de cet alinéa.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_URGENCE: PrescriptionGuide = {
  itemId: 'sex-urgence',
  titre: 'Guide contraception d’urgence',
  sousTitre: 'Selon le délai depuis le rapport',
  question: 'Quel est le délai depuis le rapport à risque ?',
  situations: [
    {
      id: 'h72',
      label: '≤ 72 h',
      hint: 'Lévonorgestrel ou ulipristal',
      icon: 'time-outline',
    },
    {
      id: 'h120',
      label: '72 à 120 h',
      hint: 'Ulipristal en priorité',
      icon: 'timer-outline',
    },
    {
      id: 'plus',
      label: '> 120 h',
      hint: 'Hors fenêtre habituelle',
      icon: 'alert-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'h72':
        return {
          titre: 'Fenêtre ≤ 72 heures',
          resume: 'Lévonorgestrel 1,5 mg ou ulipristal 30 mg selon le contexte.',
          libelles: [
            'Contraception d’urgence — lévonorgestrel 1,5 mg',
            'Contraception d’urgence — ulipristal acétate 30 mg',
          ],
          notes: [
            'Plus le délai est court, plus l’efficacité est élevée.',
            'Poids élevé / IMC élevé : efficacité du lévonorgestrel possiblement réduite — privilégier ulipristal si adapté.',
            'Vérifier interactions (inducteurs enzymatiques) et l’AMM de la spécialité.',
          ],
          alertes: [],
        };
      case 'h120':
        return {
          titre: 'Fenêtre 72–120 heures',
          resume: 'Ulipristal acétate en pratique ; lévonorgestrel hors fenêtre optimale.',
          libelles: ['Contraception d’urgence — ulipristal acétate 30 mg'],
          notes: [
            'Le lévonorgestrel n’est en général plus adapté au-delà de 72 h — se référer à l’AMM.',
          ],
          alertes: [],
        };
      case 'plus':
        return {
          titre: 'Au-delà de 120 heures',
          resume: 'Hors fenêtre habituelle des contraceptifs d’urgence oraux.',
          libelles: [],
          notes: [
            'Informer / orienter (dispositif intra-utérin éventuel côté médical, etc.).',
            'L’arrêté autorise la prescription de contraceptif d’urgence sans fixer ce délai — le délai vient de l’AMM / bonnes pratiques.',
          ],
          alertes: [
            'Ne pas promettre une efficacité hors AMM — avis médical / orientation adaptée.',
          ],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_ANNEXE_II: PrescriptionGuide = {
  itemId: 'sex-contraception-orale',
  titre: 'Assistant Annexe II',
  sousTitre: 'Mentions à porter sur l’ordonnance',
  question: 'Quelle durée de renouvellement (≤ 6 mois) ?',
  situations: [
    { id: '1', label: '1 mois', icon: 'calendar-outline' },
    { id: '2', label: '2 mois', icon: 'calendar-outline' },
    { id: '3', label: '3 mois', icon: 'calendar-outline' },
    { id: '4', label: '4 mois', icon: 'calendar-outline' },
    { id: '5', label: '5 mois', icon: 'calendar-outline' },
    { id: '6', label: '6 mois', icon: 'calendar-outline' },
    {
      id: 'hors',
      label: 'Hors cadre',
      hint: '1re prescription / > 6 mois / ordonnance > 1 an',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    if (situationId === 'hors') {
      return {
        titre: 'Hors cadre Annexe II',
        resume: 'Pas de renouvellement infirmier dans ces cas.',
        libelles: [],
        notes: [
          'Ordonnance médicale initiale datant de moins d’un an requise.',
          'Pas de 1re prescription de pilule au titre de cet alinéa.',
          'Durée max. 6 mois ; non renouvelable une nouvelle fois par l’IDE sauf liste ministérielle.',
        ],
        alertes: [
          'Interdit : 1re intention, durée > 6 mois, ordonnance initiale ≥ 12 mois, changer de molécule.',
        ],
        autorise: false,
      };
    }
    const mois = Number(situationId);
    if (!Number.isFinite(mois) || mois < 1 || mois > 6) return emptySuggestion();
    const aujourdhui = new Date();
    const dateFr = aujourdhui.toLocaleDateString('fr-FR');
    return {
      titre: `Renouvellement ${mois} mois`,
      resume: 'Mentions Annexe II à reporter sur l’original de l’ordonnance médicale.',
      libelles: [
        'Renouvellement infirmier',
        `Durée du renouvellement : ${mois} mois`,
        `Date du renouvellement : ${dateFr}`,
        'Nom, prénom et n° d’enregistrement (L. 4311-15) — à compléter',
        'Contraceptif oral — renouvellement à l’identique de l’ordonnance initiale (< 1 an)',
      ],
      duree: `Maximum 6 mois — vous avez choisi ${mois} mois.`,
      notes: [
        'Porter les mentions sur l’original de l’ordonnance médicale (Annexe II).',
        'Pharmacien : prescription initiale consultable (Art. 3).',
        'Ne pas changer de molécule / schéma hors ordonnance initiale.',
      ],
      alertes: [],
      autorise: true,
    };
  },
};

export const GUIDE_TABAC_BILAN: PrescriptionGuide = {
  itemId: 'tabac-bilan',
  titre: 'Cadre bilan tabac',
  sousTitre: 'Liste fermée de 3 examens',
  question: 'Quel est le motif ?',
  situations: [
    {
      id: 'sevrage',
      label: 'Sevrage tabagique',
      hint: 'Facteurs de risque CV',
      icon: 'leaf-outline',
    },
    {
      id: 'autre-bilan',
      label: 'Autre bilan (NFS, HbA1c…)',
      hint: 'Hors cet alinéa',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    if (situationId === 'sevrage') {
      return {
        titre: 'Bilan autorisé (liste fermée)',
        resume: 'Uniquement cholestérol, triglycérides et glycémie à jeun.',
        libelles: [
          'Cholestérol total (bilan facteurs de risque CV)',
          'Triglycérides',
          'Glycémie à jeun',
        ],
        notes: [
          'Cadre : évaluation des facteurs de risque biologiques cardiovasculaires dans le sevrage.',
        ],
        alertes: [],
      };
    }
    return {
      titre: 'Hors cet alinéa',
      resume: 'NFS, bilan hépatique, HbA1c, etc. ne sont pas dans l’Art. 1-IV.',
      libelles: [],
      notes: ['Voir le domaine VI s’ils y figurent (NFS, HbA1c diabète…).'],
      alertes: ['Ne pas élargir le bilan au-delà de la liste fermée tabac.'],
      autorise: false,
    };
  },
};

export const GUIDE_BIO_INR: PrescriptionGuide = {
  itemId: 'bio-inr',
  titre: 'Cadre renouvellement INR',
  sousTitre: 'Patient sous AVK uniquement',
  question: 'Quelle est la situation ?',
  situations: [
    {
      id: 'stable',
      label: 'AVK — renouveler INR',
      hint: 'INR déjà prescrit',
      icon: 'water-outline',
    },
    {
      id: 'desequilibre',
      label: 'INR déséquilibré',
      hint: 'Quelques jours possibles',
      icon: 'pulse-outline',
    },
    {
      id: 'aod',
      label: 'AOD / NACO',
      hint: 'Hors cadre',
      icon: 'close-circle-outline',
    },
    {
      id: 'premiere',
      label: '1er INR',
      hint: 'Hors cadre',
      icon: 'add-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'stable':
        return {
          titre: 'Renouvellement INR',
          resume: 'Patient sous AVK, INR déjà prescrit — renouveler une fois.',
          libelles: ['INR — renouvellement (traitement AVK)'],
          notes: [],
          alertes: [],
        };
      case 'desequilibre':
        return {
          titre: 'Déséquilibre — suivi court',
          resume: 'Renouvellement possible pendant quelques jours.',
          libelles: [
            'INR — renouvellement (traitement AVK)',
            'Si déséquilibre : renouvellement INR pendant quelques jours',
          ],
          notes: ['Coordonner avec le médecin en cas de déséquilibre franc.'],
          alertes: [],
        };
      case 'aod':
        return {
          titre: 'Hors cadre',
          resume: 'L’arrêté vise uniquement les AVK, pas les AOD / NACO.',
          libelles: [],
          notes: [],
          alertes: ['Interdit : INR au titre de cet alinéa pour apixaban, rivaroxaban, etc.'],
          autorise: false,
        };
      case 'premiere':
        return {
          titre: 'Hors cadre',
          resume: 'Pas de 1re prescription d’INR au titre de cet alinéa.',
          libelles: [],
          notes: [],
          alertes: ['Interdit : premier INR sans prescription initiale au titre de cet alinéa.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_BIO_NFS: PrescriptionGuide = {
  itemId: 'bio-nfs',
  titre: 'Cadre NFS / ionogramme',
  sousTitre: 'Motif clinique requis',
  question: 'Quel est le motif ?',
  situations: [
    {
      id: 'pathologie',
      label: 'Pathologie connue',
      hint: 'Motif valide',
      icon: 'medkit-outline',
    },
    {
      id: 'symptomes',
      label: 'Symptômes évocateurs',
      hint: 'Motif valide',
      icon: 'alert-circle-outline',
    },
    {
      id: 'hasard',
      label: 'Bilan au hasard',
      hint: 'Hors cadre',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    if (situationId === 'hasard') {
      return {
        titre: 'Hors cadre',
        resume: 'Pas de bilan sans motif (pathologie connue ou symptômes évocateurs).',
        libelles: [],
        notes: ['CRP, TSH, bilan hépatique, etc. ne sont pas dans cet alinéa.'],
        alertes: ['Interdit : bilan « au hasard » sans motif au titre de cet alinéa.'],
        autorise: false,
      };
    }
    if (situationId === 'pathologie' || situationId === 'symptomes') {
      return {
        titre: 'Liste fermée autorisée',
        resume:
          situationId === 'pathologie'
            ? 'Pathologie déjà connue — NFS, plaquettes, ionogramme.'
            : 'Symptômes évocateurs — NFS, plaquettes, ionogramme.',
        libelles: [
          'Numération formule sanguine (NFS)',
          'Plaquettes',
          'Ionogramme sanguin',
        ],
        notes: ['Ne pas ajouter CRP, TSH, bilan hépatique au titre de cet alinéa.'],
        alertes: [],
      };
    }
    return emptySuggestion();
  },
};

export const GUIDE_BIO_ECBU: PrescriptionGuide = {
  itemId: 'bio-ecbu',
  titre: 'Cadre ECBU',
  sousTitre: 'Antibiogramme seulement si nécessaire',
  question: 'Que prescrire ?',
  situations: [
    {
      id: 'ecbu',
      label: 'ECBU seul',
      hint: '1re intention',
      icon: 'water-outline',
    },
    {
      id: 'avec-atb',
      label: 'ECBU + antibiogramme',
      hint: 'Si nécessaire',
      icon: 'flask-outline',
    },
    {
      id: 'antibiotique',
      label: 'Antibiotique',
      hint: 'Hors liste',
      icon: 'close-circle-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'ecbu':
        return {
          titre: 'ECBU',
          resume: 'Examen cytobactériologique des urines.',
          libelles: ['ECBU avec antibiogramme si nécessaire'],
          notes: ['Antibiogramme : uniquement si nécessaire (pas systématique).'],
          alertes: [],
        };
      case 'avec-atb':
        return {
          titre: 'ECBU avec antibiogramme',
          resume: 'Réserver l’antibiogramme aux situations où il est nécessaire.',
          libelles: ['ECBU avec antibiogramme si nécessaire'],
          notes: ['Documenter pourquoi l’antibiogramme est nécessaire.'],
          alertes: [],
        };
      case 'antibiotique':
        return {
          titre: 'Hors liste',
          resume: 'L’antibiothérapie n’est pas prescritible au titre de cet alinéa.',
          libelles: [],
          notes: [],
          alertes: ['Interdit : prescrire l’antibiotique au titre de l’ECBU.'],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_BIO_GLYCEMIE: PrescriptionGuide = {
  itemId: 'bio-glycemie',
  titre: 'Cadre glycémie de laboratoire',
  sousTitre: 'À jeun ou urgence',
  question: 'Quel examen ?',
  situations: [
    {
      id: 'jeun',
      label: 'Glycémie à jeun',
      hint: 'Laboratoire — pas le lecteur',
      icon: 'sunny-outline',
    },
    {
      id: 'urgence',
      label: 'Urgence (déséquilibre + hypo)',
      hint: 'Diabète déséquilibré',
      icon: 'flash-outline',
    },
    {
      id: 'materiel',
      label: 'Bandelettes / capteur',
      hint: 'Autre fiche',
      icon: 'swap-horizontal-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'jeun':
        return {
          titre: 'Glycémie à jeun',
          resume: 'Examen de laboratoire — pas limité aux diabétiques connus.',
          libelles: ['Glycémie à jeun'],
          notes: [],
          alertes: [],
        };
      case 'urgence':
        return {
          titre: 'Glycémie en urgence',
          resume: 'Si déséquilibre du diabète ET hypoglycémie.',
          libelles: ['Glycémie en urgence (déséquilibre du diabète / hypoglycémie)'],
          notes: ['Les deux conditions de l’arrêté : déséquilibre ET hypoglycémie.'],
          alertes: [],
        };
      case 'materiel':
        return {
          titre: 'Orienter vers le matériel',
          resume: 'Bandelettes / capteurs = renouvellement à l’identique (autre fiche).',
          libelles: [],
          notes: ['Voir « Matériel surveillance glycémique ».'],
          alertes: [
            'Ce n’est pas le matériel d’autosurveillance — ne pas confondre avec cet alinéa laboratoire.',
          ],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

export const GUIDE_BIO_DIABETE: PrescriptionGuide = {
  itemId: 'bio-diabete',
  titre: 'Cadre suivi diabète',
  sousTitre: 'Diabétique connu · pas < 3 mois',
  question: 'Les conditions sont-elles réunies ?',
  situations: [
    {
      id: 'ok',
      label: 'Diabétique · pas prescrit < 3 mois',
      hint: 'Cadre autorisé',
      icon: 'checkmark-circle-outline',
    },
    {
      id: 'non-diabete',
      label: 'Non diabétique',
      hint: 'Hors cadre',
      icon: 'close-circle-outline',
    },
    {
      id: 'recent',
      label: 'Déjà prescrit < 3 mois',
      hint: 'Hors cadre',
      icon: 'time-outline',
    },
  ],
  resolve(situationId) {
    switch (situationId) {
      case 'ok':
        return {
          titre: 'Bilan de suivi autorisé',
          resume: 'Créatininémie, albuminurie/créatininurie, HbA1c.',
          libelles: [
            'Créatininémie — patient diabétique connu',
            'Albuminurie / créatininurie sur échantillon',
            'HbA1c — si non prescrit dans les 3 derniers mois',
          ],
          notes: ['Pas un dépistage du diabète au titre de cet alinéa.'],
          alertes: [],
        };
      case 'non-diabete':
        return {
          titre: 'Hors cadre',
          resume: 'Réservé au patient diabétique connu.',
          libelles: [],
          notes: ['Pour une glycémie à jeun de dépistage : fiche « Glycémie (examen de laboratoire) ».'],
          alertes: ['Interdit : patient non diabétique au titre de cet alinéa.'],
          autorise: false,
        };
      case 'recent':
        return {
          titre: 'Hors cadre',
          resume: 'Ne pas refaire le bilan à moins de 3 mois.',
          libelles: [],
          notes: [],
          alertes: [
            'Interdit : refaire créatinine / albuminurie / HbA1c si prescrits dans les 3 derniers mois.',
          ],
          autorise: false,
        };
      default:
        return emptySuggestion();
    }
  },
};

function emptySuggestion(): GuideSuggestion {
  return {
    titre: 'Situation non reconnue',
    resume: 'Reportez-vous au texte de l’arrêté.',
    libelles: [],
    notes: [],
    alertes: ['Choisissez une situation pour obtenir des libellés.'],
    autorise: false,
  };
}

export const GUIDES: PrescriptionGuide[] = [
  GUIDE_PANSEMENTS,
  GUIDE_SUPPORTS,
  GUIDE_ANTISEPTIQUES,
  GUIDE_NICOTINE,
  GUIDE_CONTENTION,
  GUIDE_INCONTINENCE,
  GUIDE_PERFUSION,
  GUIDE_NUTRITION,
  GUIDE_GLYCEMIE_DM,
  GUIDE_ADAPTATION_DOULEUR,
  GUIDE_ORTHÈSES,
  GUIDE_URGENCE,
  GUIDE_ANNEXE_II,
  GUIDE_TABAC_BILAN,
  GUIDE_BIO_INR,
  GUIDE_BIO_NFS,
  GUIDE_BIO_ECBU,
  GUIDE_BIO_GLYCEMIE,
  GUIDE_BIO_DIABETE,
];

export const GUIDE_BY_ITEM_ID: Record<string, PrescriptionGuide> = Object.fromEntries(
  GUIDES.map((g) => [g.itemId, g]),
);

export function getGuideForItem(itemId: string): PrescriptionGuide | undefined {
  return GUIDE_BY_ITEM_ID[itemId];
}
