# N'nvlé Déclic — Direction produit

## 1. Positionnement

N'nvlé Déclic n'est pas une bibliothèque de cours. C'est un **accompagnateur numérique d'alphabétisation** conçu pour des personnes peu ou pas scolarisées.

Le produit doit rester :
- humain ;
- vocal et visuel ;
- extrêmement simple ;
- interactif ;
- adaptatif ;
- local-first ;
- utilisable avec une connexion faible ;
- orienté vers des compétences réellement utiles dans la vie quotidienne.

Cette orientation correspond aux besoins du contexte ivoirien : le MENA définit l'alphabétisation comme l'acquisition de compétences de base en lecture, écriture et calcul et cible notamment les jeunes et adultes analphabètes ou peu scolarisés. La page officielle du MENA indique actuellement un taux d'analphabétisme estimé à 47 % selon l'UNESCO. 

## 2. Promesse produit

À l'ouverture :

> « Bonjour. Je vais t'aider à apprendre à lire, à écrire et à compter. »

L'utilisateur doit rapidement pouvoir :
1. comprendre quoi faire sans savoir lire ;
2. apprendre une compétence ;
3. pratiquer ;
4. recevoir une correction bienveillante ;
5. reprendre exactement là où il s'est arrêté ;
6. voir et entendre ses progrès ;
7. utiliser ce qu'il apprend dans une situation réelle.

## 3. Parcours pédagogique

Le parcours de référence est :

**oral → sons → lettres → syllabes → mots → phrases → textes → écriture → calcul → vie quotidienne → autonomie.**

Une compétence ne doit pas être considérée comme acquise sur une seule réussite.

États :
- NON APPRISE ;
- EN APPRENTISSAGE ;
- PRESQUE ;
- MAÎTRISÉE ;
- CONSOLIDÉE.

Les révisions sont espacées et les difficultés reviennent naturellement dans les séances.

## 4. MVP actuel

Le dépôt contient déjà :
- onboarding ;
- enseignant visuel ;
- synthèse vocale ;
- reconnaissance vocale navigateur ;
- exercices de lettres, syllabes, mots et lecture ;
- écriture au doigt ;
- calcul et argent ;
- mémoire des difficultés ;
- progression locale ;
- reprise de séance ;
- sauvegarde/export du parcours ;
- certificats PDF ;
- rappels.

Les fondations viennent donc d'être renforcées sans changer la branche de travail.

## 5. Priorités d'évolution

### P0 — Fiabilité
- aucune perte de progression ;
- reprise exacte ;
- mode hors connexion ;
- état réseau honnête ;
- aucun certificat avant validation ;
- fallback si la reconnaissance vocale n'est pas disponible ;
- tests mobiles Android en priorité.

### P1 — Moteur pédagogique
- banque de compétences structurée ;
- prérequis entre compétences ;
- répétition espacée ;
- difficultés phonétiques ;
- parcours adaptatif ;
- évaluations de fin de module ;
- révision avant oubli.

### P2 — Voix et interaction
- meilleure reconnaissance des nombres et des réponses courtes ;
- gestion des accents et variantes de prononciation ;
- réduction des faux positifs ;
- mode conversationnel plus naturel ;
- feedback audio très court.

### P3 — Vie quotidienne
Construire des modules :
- marché ;
- argent ;
- transport ;
- téléphone ;
- maison ;
- santé ;
- administration ;
- travail et activité économique.

### P4 — Déploiement communautaire
À terme :
- profils apprenants ;
- centres d'alphabétisation ;
- formateurs ;
- suivi de groupes ;
- tableaux de bord ;
- statistiques anonymisées ;
- contenus par territoire ;
- langues nationales.

## 6. Architecture cible

Le produit doit évoluer vers des moteurs séparés :

**Identité**
→ profil et reprise.

**Pédagogie**
→ curriculum, prérequis, compétences.

**Maîtrise**
→ score, confiance, répétition, consolidation.

**Voix**
→ TTS, STT, correction.

**Contenu**
→ audio, images, animations, exercices.

**Local**
→ sauvegarde immédiate.

**Synchronisation**
→ file d'événements et résolution de conflits.

**Certification**
→ validation indépendante du simple nombre de jours.

**Analytics**
→ données agrégées utiles à l'amélioration pédagogique.

## 7. Règle d'or

Ne jamais ajouter une fonctionnalité qui rend l'application plus compliquée pour l'apprenant.

Chaque écran doit répondre à une seule question :

> « Qu'est-ce que je dois faire maintenant ? »

## 8. Évolution africaine

Le français est le point de départ. L'architecture doit cependant isoler les textes, sons, phonèmes, exemples et contenus afin de permettre ensuite l'ajout de langues africaines et de variantes locales sans réécrire le moteur.

## 9. Méthode de validation

Le produit doit être testé avec de vrais apprenants du public cible.

Mesures prioritaires :
- compréhension spontanée de l'interface ;
- taux de réussite par compétence ;
- erreurs récurrentes ;
- temps avant première réussite ;
- abandon de séance ;
- reprise après interruption ;
- progression sur plusieurs semaines ;
- compétences transférées à la vie quotidienne.

L'objectif n'est pas de maximiser le nombre de points, mais la **transformation réelle de l'apprenant**.

## 10. Sources de cadrage

- Ministère de l'Éducation nationale, Alphabétisation : https://www.education.gouv.ci/index.php/Reseaux/alphabetisation
- Gouvernement de Côte d'Ivoire, campagne d'alphabétisation 2025-2026 : https://gouv.ci/index.php/actualite/education-nationale-le-gouvernement-reaffirme-son-engagement-a-renforcer-linclusion-sociale-et-le-developpement-durable-par-une-alphabetisation-accessible-et-de-qualite-1858
- Stratégie nationale d'alphabétisation 2026-2031, projet consulté : https://projet-prseb.ci/wp-content/uploads/2026/02/Strategie-nationale-de-lAlpha-2026-2031_-draft-01-2.pdf
