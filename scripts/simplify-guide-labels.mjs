import fs from 'node:fs';

const path = new URL('../src/data/guidesPrescription.ts', import.meta.url);
let s = fs.readFileSync(path, 'utf8');

/** @type {[string, string][]} */
const reps = [
  ["titre: 'Guide pansements'", "titre: 'Choisir un pansement'"],
  ["sousTitre: 'Selon l’aspect et l’exsudat de la plaie'", "sousTitre: 'Selon l’aspect de la plaie'"],
  ["question: 'Quel est le profil de la plaie ?'", "question: 'Comment est la plaie ?'"],
  ["titre: 'Guide supports anti-escarre'", "titre: 'Choisir un support'"],
  ["sousTitre: 'Selon le risque ou le stade'", "sousTitre: 'Selon le risque d’escarre'"],
  ["question: 'Quel est le niveau de risque / le besoin ?'", "question: 'Quel est le risque ou le besoin ?'"],
  ["titre: 'Cadre antiseptiques (plaie)'", "titre: 'Puis-je mettre un antiseptique ?'"],
  ["sousTitre: 'Vérifier si la prescription est autorisée'", "sousTitre: 'Vérifier le cadre de l’arrêté'"],
  ["question: 'Quelle est la situation clinique ?'", "question: 'Quelle est la situation ?'"],
  ["titre: 'Guide substituts nicotiniques'", "titre: 'Choisir un substitut nicotine'"],
  ["sousTitre: 'Selon l’intensité de la dépendance'", "sousTitre: 'Selon la dépendance au tabac'"],
  [
    "question: 'Quelle est l’intensité estimée de la dépendance ?'",
    "question: 'À quel point la personne dépend-elle du tabac ?'",
  ],
  ["titre: 'Guide contention (cadre plaie)'", "titre: 'Choisir la contention'"],
  ["sousTitre: 'Choisir la forme — force à l’identique'", "sousTitre: 'Même force qu’avant — cadre plaie'"],
  ["question: 'Quelle forme de contention ?'", "question: 'Quelle forme ?'"],
  ["titre: 'Guide incontinence / stomies'", "titre: 'Choisir le matériel'"],
  ["sousTitre: 'Selon le besoin urogénital ou de stomie'", "sousTitre: 'Incontinence, sondes ou stomies'"],
  ["question: 'Quel est le besoin principal ?'", "question: 'De quoi a besoin le patient ?'"],
  ["titre: 'Guide perfusion à domicile'", "titre: 'Choisir le matériel de perfusion'"],
  ["sousTitre: 'Selon la voie d’accès déjà en place'", "sousTitre: 'Selon la voie déjà en place'"],
  ["question: 'Quelle est la situation de perfusion ?'", "question: 'Quelle voie de perfusion ?'"],
  ["titre: 'Guide nutrition entérale'", "titre: 'Sonde ou matériel de nutrition'"],
  ["sousTitre: 'Sonde vs renouvellement du matériel'", "sousTitre: '1re sonde ou simple renouvellement'"],
  ["question: 'Que devez-vous faire ?'", "question: 'Que voulez-vous faire ?'"],
  ["titre: 'Guide matériel glycémique'", "titre: 'Renouveler le matériel glycémie'"],
  ["sousTitre: 'Renouvellement à l’identique uniquement'", "sousTitre: 'Uniquement à l’identique'"],
  ["question: 'Quel matériel renouveler (à l’identique) ?'", "question: 'Quel matériel renouveler ?'"],
  ["titre: 'Cadre adaptation posologie'", "titre: 'Puis-je adapter la dose ?'"],
  [
    "sousTitre: 'Uniquement selon l’ordonnance initiale'",
    "sousTitre: 'Seulement dans le cadre de l’ordonnance médicale'",
  ],
  ["question: 'Quelle est votre intention ?'", "question: 'Que voulez-vous faire ?'"],
  ["titre: 'Guide orthèses de contention'", "titre: 'Renouveler des bas'"],
  [
    "sousTitre: 'Renouvellement à l’identique — hors cadre plaie'",
    "sousTitre: 'À l’identique — hors cadre plaie'",
  ],
  ["question: 'Que renouveler (à l’identique) ?'", "question: 'Que renouveler ?'"],
  ["titre: 'Guide contraception d’urgence'", "titre: 'Choisir la contraception d’urgence'"],
  ["question: 'Quel est le délai depuis le rapport à risque ?'", "question: 'Combien de temps depuis le rapport ?'"],
  ["titre: 'Assistant Annexe II'", "titre: 'Mentions pour renouveler la pilule'"],
  ["sousTitre: 'Mentions à porter sur l’ordonnance'", "sousTitre: 'Texte à écrire sur l’ordonnance'"],
  ["question: 'Quelle durée de renouvellement (≤ 6 mois) ?'", "question: 'Pour combien de mois (max. 6) ?'"],
  ["titre: 'Cadre bilan tabac'", "titre: 'Bilan sanguin arrêt du tabac'"],
  ["sousTitre: 'Liste fermée de 3 examens'", "sousTitre: '3 analyses seulement'"],
  ["question: 'Quel est le motif ?'", "question: 'Dans quel cadre ?'"],
  ["titre: 'Cadre renouvellement INR'", "titre: 'Puis-je renouveler l’INR ?'"],
  [
    "sousTitre: 'Patient sous AVK uniquement'",
    "sousTitre: 'Uniquement sous AVK (pas Eliquis / Xarelto…)'",
  ],
  ["titre: 'Cadre NFS / ionogramme'", "titre: 'Puis-je prescrire NFS / iono ?'"],
  ["sousTitre: 'Motif clinique requis'", "sousTitre: 'Il faut un motif clair'"],
  ["titre: 'Cadre ECBU'", "titre: 'Prescrire un ECBU'"],
  ["sousTitre: 'Antibiogramme seulement si nécessaire'", "sousTitre: 'Antibiogramme seulement si besoin'"],
  ["question: 'Que prescrire ?'", "question: 'Que voulez-vous prescrire ?'"],
  ["titre: 'Cadre glycémie de labo'", "titre: 'Glycémie au labo'"],
  ["sousTitre: 'À jeun ou urgence'", "sousTitre: 'À jeun ou en urgence'"],
  ["question: 'Quel examen ?'", "question: 'Quelle glycémie ?'"],
  ["titre: 'Cadre suivi diabète'", "titre: 'Suivi labo du diabète'"],
  ["sousTitre: 'Diabétique connu · pas < 3 mois'", "sousTitre: 'Diabétique connu, pas fait depuis 3 mois'"],
  ["question: 'Les conditions sont-elles réunies ?'", "question: 'Les conditions sont-elles OK ?'"],
  [
    "Aide au choix — liste fermée de l’arrêté. Adapter au jugement clinique.",
    "Aide au choix — à adapter selon votre jugement clinique.",
  ],
];

let n = 0;
for (const [from, to] of reps) {
  if (!s.includes(from)) {
    console.log('MISS:', from);
    continue;
  }
  s = s.split(from).join(to);
  n++;
}

fs.writeFileSync(path, s);
console.log('replaced', n, '/', reps.length);
