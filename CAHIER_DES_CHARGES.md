# Cahier des charges — Inficheck

Application mobile d’aide à la **prescription infirmière** encadrée par l’arrêté du 26 juin 2026.

> **Positionnement** : guide pratique et checklist de conformité pour l’IDE.  
> L’app **n’autorise pas** une prescription hors liste : elle aide à vérifier si un produit / examen est prescrit ou renouvelable, sous quelles conditions, et à consulter les infos médicaments officielles.

---

## 0. Référence légale (fondement produit)

| Élément | Détail |
|---------|--------|
| Texte | Arrêté du 26 juin 2026 fixant la liste des produits de santé et examens complémentaires que les infirmiers diplômés d’État sont autorisés à **prescrire** ou à **renouveler** |
| NOR | `SFHH2617311A` |
| Publication | Journal officiel du **27 juin 2026**, texte n° 24 |
| Légifrance | https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054321926 |
| Entrée en vigueur | Au plus tard le 30 juin 2026 |
| Source médicaments | [Base de données publique des médicaments](https://base-donnees-publique.medicaments.gouv.fr) (ANSM / HAS / UNCAM) |

**Principes transversaux du texte (à respecter dans l’app) :**

1. **Liste fermée** — ce qui n’est pas dans l’arrêté n’est pas prescrit / renouvelé par l’IDE.
2. **Deux modalités** — prescription de 1re intention **ou** renouvellement (souvent à l’identique, avec conditions).
3. **Traçabilité obligatoire (Art. 2)** — toute prescription est inscrite au dossier patient ou au DMP.
4. **Renouvellement (Art. 3)** — le pharmacien doit pouvoir consulter la prescription initiale.
5. Le texte officiel sur Légifrance reste la **seule référence opposable** ; l’app est une aide, pas une source de droit.

**Texte lié (hors MVP, à mentionner) :** arrêté « jumeau » du même jour sur les actes et soins (`SFHH2610764A`, JO texte n° 25).

---

## 1. Contexte et objectifs

### 1.1 Contexte

Depuis l’arrêté du 26 juin 2026, l’IDE peut prescrire ou renouveler une liste précise de produits de santé et d’examens (vaccins, plaies, santé sexuelle, sevrage, antalgiques palier I, DM, biologie ciblée…). Sur le terrain, la difficulté n’est plus seulement « comment administrer », mais **« ai-je le droit de prescrire / renouveler ceci, et sous quelles conditions ? »**.

### 1.2 Objectifs

- Permettre de **retrouver rapidement** un item de la liste de l’arrêté (par domaine, mot-clé, type).
- Distinguer clairement **prescription initiale** vs **renouvellement**.
- Afficher les **conditions / limites** (âge, durée, exclusions, formation, mentions obligatoires).
- Relier, quand c’est un médicament, les infos de la **base publique des médicaments**.
- Rappeler les obligations de **traçabilité** (dossier patient / DMP).
- Fonctionner **hors ligne** pour le cœur de la liste légale.

### 1.3 Non-objectifs (hors périmètre V1)

- Remplacer Légifrance ou produire un avis juridique opposable.
- Générer une ordonnance électronique « officielle » / e-prescription remboursable.
- Remplacer le DPI / DMP de l’établissement.
- Couvrir l’arrêté « actes et soins » (`SFHH2610764A`) en détail.
- Gérer la rémunération / cotation conventionnelle (hors arrêté).

---

## 2. Utilisateurs cibles

| Priorité | Profil | Besoin principal |
|----------|--------|------------------|
| **V1 — cible** | **IDEL** (infirmier diplômé d’État libéral) | Prescrire / renouveler au domicile ou en cabinet, hors DPI hospitalier |
| Secondaire | Étudiant(e) IDE | Apprendre la liste et les garde-fous |
| V2+ | IDE salarié / hospitalier | Adaptation éventuelle (hors focus V1) |

**Conséquences UX V1 (IDEL) :** parcours rapide sur le terrain, offline prioritaire, focus traçabilité dossier patient / DMP, renouvellements (contraception, DM, INR…), peu de jargon « service hospitalier ».

---

## 3. Périmètre fonctionnel — MVP (V1)

### 3.1 Accueil

- Accès rapide : **Catalogue arrêté**, **Recherche**, **Médicaments (BDPM)**, **Rappels légaux**.
- Bannière : référence NOR + lien / mention Légifrance + disclaimer.

### 3.2 Catalogue de l’arrêté (cœur produit)

Navigation par les **6 domaines** de l’article 1 :

| # | Domaine | Exemples (synthèse) |
|---|---------|---------------------|
| I | Vaccination | Calendrier ≥ 11 ans ; grippe ≥ 11 ans ; Covid ≥ 5 ans ; exceptions immunodéprimés ; déclaration Ordre + formation (Annexe I) |
| II | Prévention / traitement de la plaie | Supports anti-escarre ; pansements (durée initiale 7 j) ; antiseptiques sous conditions ; contention (renouvellement à l’identique) |
| III | Santé sexuelle et reproductive | Renouvellement contraceptifs oraux (≤ 6 mois, Annexe II) ; préservatifs ; contraception d’urgence ; β-HCG ; dépistages IST |
| IV | Sevrage tabagique | Substituts nicotiniques ; bilan cholestérol / triglycérides / glycémie à jeun |
| V | Produits de santé | Antalgiques palier I ; adaptation posologie douleur (selon prescription initiale) ; solutions stériles ; DM (incontinence, perfusion, glycémie, nutrition…) |
| VI | Examens biologiques / bactériologiques | INR (renouvellement) ; NFS / iono ; ECBU ; glycémie ; créatinine / albuminurie / HbA1c (diabète, conditions) |

Chaque fiche item affiche a minima :

- Libellé aligné sur l’arrêté
- Modalité : **Prescrire** / **Renouveler** / les deux
- Conditions (âge, durée, exclusions, « à l’identique », pathologie connue…)
- Obligations associées (traçabilité, mentions Annexe II, déclaration vaccins…)
- Lien éventuel vers fiche médicament BDPM (si médicament)

### 3.3 Recherche

- Recherche plein texte sur le catalogue (ex. « pansement », « INR », « paracétamol », « ECBU»).
- Filtres : domaine, modality (prescrire / renouveler), médicaments vs DM vs examens.

### 3.4 Médicaments — Base publique (import officiel)

- **Source unique** : [Base de données publique des médicaments](https://base-donnees-publique.medicaments.gouv.fr) (export / fichiers officiels, pas de saisie manuelle du catalogue médicaments).
- Import dans l’app (pipeline de build ou script) → stockage local pour usage offline.
- Recherche médicament / substance sur cet extrait importé.
- Fiche : nom, substance(s), infos de bon usage disponibles dans la BDPM.
- Indicateur : **« Autorisé prescription IDE ? »** (oui / non / sous conditions) croisé avec le catalogue de l’arrêté.
- Afficher la **date de l’import / dernière mise à jour** des données locales.
- Respecter les conditions d’utilisation de la BDPM ; citer la source dans l’app.

### 3.5 Rappels légaux / checklist prescription

Checklist courte avant de prescrire / renouveler :

- [ ] Item bien présent dans la liste de l’arrêté
- [ ] Modalité correcte (1re intention vs renouvellement)
- [ ] Conditions remplies (âge, durée, exclusions, formation si vaccins…)
- [ ] Traçabilité prévue (dossier patient / DMP) — Art. 2
- [ ] Si renouvellement : prescription initiale consultable (Art. 3)
- [ ] Si contraceptifs oraux : mentions Annexe II sur l’ordonnance

### 3.6 Mentions légales / disclaimer

Texte visible :

- Aide à la pratique fondée sur l’arrêté `SFHH2617311A` ; **seul le JO / Légifrance fait foi**.
- Données médicaments : BDPM ; toujours vérifier la notice / AMM à jour.
- Ne remplace pas le jugement clinique ni la coordination avec le médecin.

---

## 4. Évolutions prévues (V2+)

- Mise à jour automatisée du catalogue si l’arrêté évolue.
- Mode formation (quiz sur les 6 domaines).
- Favoris / « mon panier de prescriptions courantes ».
- Assistant « mentions Annexe II » (renouvellement contraceptifs).
- Couverture partielle de l’arrêté actes/soins `SFHH2610764A`.
- Sync différentielle BDPM (quand une API / export stable est utilisable).
- Calculateur de dose **uniquement** pour les antalgiques palier I autorisés (optionnel).

---

## 5. Exigences non fonctionnelles

| Critère | Exigence |
|---------|----------|
| Plateformes | iOS et Android |
| Offline | Catalogue arrêté + checklist + extrait BDPM utilisables sans réseau |
| Exactitude | Libellés et conditions fidèles au texte ; version du texte datée dans l’app |
| Performance | Recherche catalogue < 1 s |
| Lisibilité | Terrain / libéral : gros boutons, contrastes élevés |
| Données patient | Aucune donnée nominative en V1 |
| Langue | Français |

---

## 6. Contraintes techniques

| Élément | Choix |
|---------|--------|
| Framework | Expo (SDK 57) + React Native |
| Langage | TypeScript |
| Navigation | React Navigation |
| **Base de données V1** | **SQLite locale sur l’appareil** (`expo-sqlite`) |
| Catalogue arrêté | Tables SQLite (seed depuis JSON versionné au build) |
| Données médicaments | **Import BDPM officiel** → `assets/bdpm/inficheck.db` (`npm run import:bdpm`) |
| Favoris / réglages | SQLite ou AsyncStorage |
| Backend V1 | **Aucun** (script d’import hors app) |
| Distribution | Expo Go → builds EAS pour App Store / Google Play |

Règle projet : consulter la doc Expo `v57.0.0` avant implémentation.

### 6.1 Architecture données (figée)

```
Script PC / CI
  → télécharge fichiers BDPM officiels
  → transforme / indexe
  → produit artefact SQLite (ou seed importable)
       ↓
App Expo (téléphone IDEL)
  → SQLite locale = source de vérité au quotidien
  → lecture offline (catalogue + médicaments + recherche)
```

- **Pas de serveur** pour le fonctionnement normal en V1.
- Afficher dans l’app la **date d’import BDPM** et la **version du catalogue arrêté**.
- V2 éventuelle : petit backend uniquement pour **pousser des mises à jour** de la base locale (pas pour le runtime offline).

---

## 7. Modèle de données (esquisse)

Stockage : **SQLite** sur l’appareil.

### 7.1 Item d’arrêté

- `id`, `domaine` (I→VI), `titre`, `description`
- `modalite`: `prescrire` | `renouveler` | `les_deux`
- `conditions[]` (âge, durée max, exclusions, « à l’identique »…)
- `obligations[]` (traçabilité, Ordre, formation, mentions ordonnance…)
- `references`: article / annexe (I ou II)
- `liensBDPM[]` (optionnel)
- `sourceVersion`: `SFHH2617311A` + date JO

### 7.2 Médicament (BDPM)

- Identifiants BDPM, nom, substances, infos notice / AMM disponibles
- `eligiblePrescriptionIDE`: booléen + `itemArreteId` lié
- Index SQLite sur nom / substance pour la recherche IDEL

### 7.3 Métadonnées locales

- `bdpmImportedAt`, `arreteCatalogVersion`, `appDataBuildId`
---

## 8. Parcours utilisateurs (résumé)

```
Accueil
  ├─ Catalogue arrêté → Domaine → Fiche item (+ conditions)
  ├─ Recherche → Résultats (arrêté ± BDPM)
  ├─ Médicaments BDPM → Fiche → Badge « IDE : oui / non / conditions »
  └─ Checklist prescription → Validation des garde-fous Art. 2 / 3 / annexes
```

---

## 9. Critères d’acceptance MVP

- [ ] Les 6 domaines de l’Art. 1 sont navigables.
- [ ] Chaque item indique clairement **prescrire** vs **renouveler**.
- [ ] Les conditions majeures (ex. pansements 7 j, contraceptifs 6 mois, vaccins âge / Ordre) sont visibles.
- [ ] Checklist rappelle Art. 2 (traçabilité) et Art. 3 (renouvellement).
- [ ] Recherche trouve au moins : vaccin, pansement, INR, antalgique palier I, ECBU.
- [ ] Une fiche médicament BDPM s’affiche depuis **SQLite locale** avec indicateur d’éligibilité IDE.
- [ ] Disclaimer + référence NOR / JO / Légifrance visibles.
- [ ] Offline : catalogue + recherche BDPM + checklist OK (airplane mode).
- [ ] Date d’import BDPM visible dans l’app.

---

## 10. Risques et points d’attention

| Risque | Mitigation |
|--------|------------|
| Interprétation erronée de l’arrêté | Libellés proches du JO ; disclaimer ; lien Légifrance |
| Liste non à jour | Versionner SQLite + date d’import affichée |
| Confusion médicament hors liste | Badge « non autorisé IDE » explicite |
| BDPM incomplet / licence d’usage | Respecter conditions d’utilisation ; citer la source ; pas de revente de base |
| Confusion avec l’arrêté actes/soins | Le mentionner mais le sortir du MVP |

---

## 11. Livrables

1. App mobile MVP orientée **IDEL** (Catalogue, Recherche, BDPM, Checklist, Mentions).
2. **SQLite locale** (`expo-sqlite`) : catalogue arrêté + médicaments.
3. Pipeline d’**import BDPM** → seed / artefact SQLite.
4. Ce cahier des charges.
5. README d’installation / resync BDPM.

---

## 12. Décisions tranchées / restantes

### Tranchées

| Décision | Choix |
|----------|--------|
| Stack mobile | **Expo 57 + React Native + TypeScript** |
| Stores | App Store + Google Play (via EAS) |
| Source médicaments | **Import BDPM** |
| Public V1 | **IDEL** |
| Base de données V1 | **SQLite sur l’appareil** (`expo-sqlite`), offline-first |
| Backend V1 | **Aucun** |

### Encore ouvertes

1. Inclure dès la V1 un écran dédié « Annexe I vaccins » / « Annexe II contraceptifs » ?

---

## 13. Synthèse produit (une phrase)

**Inficheck** aide l’**IDEL** à appliquer l’arrêté du 26 juin 2026 (`SFHH2617311A`) : retrouver ce qu’il peut prescrire ou renouveler, sous quelles conditions, avec rappel de traçabilité, et croisement avec la **BDPM** importée en **SQLite locale**.

---

*Document vivant — le texte opposable reste le Journal officiel / Légifrance.*
