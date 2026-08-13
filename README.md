# Apprentissage Facile

je veux creer une aplication 

N’nvlé Déclic
 Le plaisir d'apprendre, pas à pas.  




CAHIER DES CHARGES COMPLET

Application d’alphabétisation intelligente — Lire, écrire et compter

1. VISION DU PROJET

Développer une application mobile d’alphabétisation destinée en priorité aux adultes qui ne savent pas lire et écrire, ou qui ont de très grandes difficultés en lecture et en écriture.

L'application doit être pensée d'abord pour une personne qui part réellement de zéro.

Elle ne doit pas être conçue comme une application scolaire classique.

Elle doit donner à l'utilisateur l'impression d'avoir un véritable enseignant humain à ses côtés, capable de parler, montrer, écouter, corriger, encourager, répéter, féliciter et adapter automatiquement les exercices à son niveau.

L'objectif initial est de permettre à un adulte, en environ 90 jours, à raison d'environ 15 minutes d'utilisation par jour, de :

reconnaître les lettres et leurs sons ;

comprendre et assembler les syllabes ;

lire des mots simples ;

commencer à lire des phrases ;

écrire des lettres ;

écrire des syllabes ;

écrire des mots simples ;

comprendre les nombres ;

effectuer des calculs simples de la vie quotidienne ;

devenir progressivement autonome dans des situations courantes.

Après ces 90 jours, l'application doit continuer à proposer un parcours de perfectionnement.

Philosophie centrale

L'application doit respecter cette logique :

ÉCOUTER → COMPRENDRE → RÉPÉTER → RECONNAÎTRE → LIRE → ÉCRIRE → UTILISER

L'application doit être environ :

50 % vocale + 50 % visuelle/écrite et interactive.

La voix est fondamentale parce que l'utilisateur peut ne pas savoir lire les textes affichés à l'écran.

2. PUBLIC CIBLE

Cible initiale :

adultes analphabètes ;

adultes ayant commencé une alphabétisation mais ayant abandonné ;

personnes ayant reçu un enseignement insuffisant ;

personnes ayant honte de leur niveau ;

personnes vivant en zone urbaine, périurbaine ou rurale ;

personnes ayant peu de temps ;

personnes ayant une connexion Internet faible ou intermittente.

L'application doit être particulièrement adaptée aux réalités africaines.

Elle doit utiliser un français :

simple ;

courant ;

naturel ;

directement compréhensible ;

sans vocabulaire scolaire compliqué ;

sans jargon ;

sans phrases inutilement longues.

Ne jamais parler à l'utilisateur comme dans un manuel administratif.

Exemple à privilégier :

« Regarde. »

« Écoute. »

« Répète. »

« À toi maintenant. »

« Très bien. »

« Essaie encore. »

« Écoute bien. »

« Tu es presque arrivé. »

Exemple à éviter :

« Nous allons maintenant procéder à l'identification phonétique de cette unité syllabique. »

3. PREMIÈRE OUVERTURE : L'INSCRIPTION DOIT ÊTRE UNE CONVERSATION

L'utilisateur ne doit pas avoir à remplir un formulaire classique.

Au premier lancement, un enseignant numérique apparaît.

Il parle naturellement :

« Bonjour. Je vais t'aider à apprendre à lire, à écrire et à compter.
Comment tu t'appelles ? »

L'utilisateur répond vocalement.

Exemple :

« Je m'appelle Mariam Kouassi. »

L'application comprend et enregistre automatiquement le nom.

Elle poursuit :

« Très bien Mariam. Dans quelle ville tu habites ? »

Puis :

« Quel est ton numéro de téléphone ? »

Les informations essentielles sont enregistrées automatiquement.

Le profil initial comprend notamment :

nom ;

prénom / nom complet ;

numéro de téléphone ;

ville de résidence ;

date de début du parcours ;

niveau initial ;

progression ;

résultats ;

compétences maîtrisées ;

difficultés détectées ;

historique des séances.

Il ne faut pas obliger l'utilisateur à cliquer sur « Enregistrer ».

La conversation est l'inscription.

4. IDENTITÉ PERSISTANTE

Le principe doit être :

UNE PERSONNE = UN PARCOURS

Après la première utilisation sur son téléphone, l'application doit reconnaître automatiquement l'utilisateur.

Il ne doit pas devoir se connecter chaque jour.

Exemple :

Mariam revient le lendemain.

L'application :

« Bonjour Mariam ! Tu es revenue. On continue ? »

Elle reprend directement son parcours.

Elle ne demande pas :

son niveau ;

quelle leçon elle suivait ;

ce qu'elle avait déjà appris ;

de recommencer le parcours.

Elle sait où elle en était.

Cas d'une déconnexion

Si l'utilisateur est déconnecté mais revient sur le même téléphone, le système doit conserver son parcours localement.

Si une identification est nécessaire, utiliser une combinaison suffisamment fiable basée notamment sur :

nom complet ;

numéro de téléphone ;

ville ;

identifiant unique interne.

Ne jamais utiliser uniquement le nom comme identifiant, car deux personnes peuvent avoir le même nom.

Le système doit cependant rester extrêmement simple pour l'utilisateur.

5. ARCHITECTURE LOCAL-FIRST

Cette fonctionnalité est NON NÉGOCIABLE.

L'application doit fonctionner selon le principe :

LOCAL D'ABORD → SYNCHRONISATION AUTOMATIQUE

Dès qu'une information est créée ou qu'une progression est enregistrée :

elle est enregistrée immédiatement sur le téléphone ;

elle est ensuite synchronisée avec le serveur lorsque la connexion est disponible.

L'utilisateur ne doit pas avoir à appuyer sur :

« Synchroniser ».

La synchronisation doit être invisible.

Exemple

Mariam travaille sans Internet.

Elle termine une activité.

La progression est immédiatement enregistrée localement.

Internet revient quelques heures plus tard.

L'application synchronise automatiquement.

Si Internet disparaît

L'apprentissage continue normalement.

Aucune fonctionnalité pédagogique essentielle ne doit dépendre d'une connexion permanente.

6. CONTENU DISPONIBLE HORS CONNEXION

Après la première connexion, l'application doit pouvoir télécharger les ressources nécessaires au parcours :

leçons ;

vidéos ;

audios ;

animations ;

images ;

exercices ;

syllabes ;

mots ;

exercices d'écriture ;

exercices de calcul ;

évaluations.

L'utilisateur doit pouvoir continuer son apprentissage hors connexion.

Les contenus pédagogiques peuvent être téléchargés progressivement afin de ne pas imposer un téléchargement énorme dès le départ.

La progression personnelle doit toujours rester disponible localement.

7. OBJECTIF PÉDAGOGIQUE : 90 JOURS

Le parcours initial doit viser environ :

15 MINUTES PAR JOUR

pendant :

90 JOURS

Le but n'est pas de rendre l'apprentissage long.

L'utilisateur doit obtenir rapidement des résultats visibles pour éviter la démotivation.

Phase 1 — Premier mois

Objectif :

« Je commence à lire et à écrire. »

Apprendre :

lettres ;

sons ;

syllabes simples ;

assemblage des syllabes ;

premiers mots ;

premiers tracés ;

premiers nombres.

Phase 2 — Deuxième mois

Objectif :

« Je lis des mots et des petites phrases. »

Apprendre :

syllabes plus complexes ;

sons complexes ;

mots courants ;

phrases simples ;

lecture à voix haute ;

écriture de mots ;

additions et soustractions simples.

Phase 3 — Troisième mois

Objectif :

« Je me débrouille dans la vie quotidienne. »

Apprendre :

lecture de phrases ;

petits textes ;

écriture de phrases simples ;

nombres ;

argent ;

prix ;

calculs courants ;

informations pratiques ;

compréhension de textes simples.

Après les 90 jours :

PERFECTIONNEMENT CONTINU

L'utilisateur peut continuer vers :

lecture plus fluide ;

meilleure orthographe ;

écriture plus correcte ;

compréhension de textes ;

rédaction ;

calcul ;

vocabulaire ;

autonomie quotidienne.

8. MÉTHODE DES SYLLABES

Le moteur pédagogique doit donner une place centrale aux syllabes.

Exemple :

M + A → MA

L'enseignant explique :

« M et A font MA. »

Puis :

« Écoute : MA. »

Puis :

« Répète : MA. »

Puis :

« Maintenant, lis tout seul. »

Le système analyse la réponse.

Ensuite :

MA + MA → MAMA

Puis :

PA + PA → PAPA

Puis :

MO + TO → MOTO

Puis progressivement des mots plus longs.

La progression doit aller du très simple vers le plus complexe.

9. ASSEMBLAGE DES SYLLABES

Créer une mécanique pédagogique appelée par exemple :

« Je colle les morceaux »

L'utilisateur voit :

MA + MA

L'enseignant :

« Colle les deux morceaux. »

Animation :

MA + MA → MAMA

Puis :

« Lis le mot. »

L'utilisateur prononce.

Même principe pour :

PA + PA ;

MO + TO ;

MA + MAN ;

BA + NA + NE ;

etc.

Le système doit progressivement apprendre au cerveau à comprendre :

LETTRE → SON → SYLLABE → MOT → PHRASE

10. SONS COMPLEXES

Prévoir progressivement les combinaisons et sons complexes du français :

AN ;

EN ;

ON ;

IN ;

UN ;

OU ;

OI ;

AI ;

EI ;

AU ;

EAU ;

etc.

Ne pas introduire toutes les difficultés simultanément.

L'application doit faire écouter le son, le faire répéter et montrer comment les lettres se combinent.

Exemple de logique pédagogique :

lettres → son → répétition → reconnaissance → lecture → utilisation dans un mot.

L'objectif n'est pas simplement de mémoriser une combinaison de lettres, mais de comprendre le son produit.

11. APPRENTISSAGE DE LA LECTURE

Chaque nouvelle notion doit être travaillée de plusieurs façons.

ÉCOUTER

L'enseignant prononce.

RÉPÉTER

L'utilisateur répète.

RECONNAÎTRE

L'application demande de reconnaître le bon élément.

LIRE

L'utilisateur lit ce qui est affiché.

UTILISER

Le mot apparaît dans une phrase ou une situation.

Cela évite l'apprentissage mécanique.

12. RECONNAISSANCE VOCALE

L'application doit pouvoir demander :

« Lis ce mot. »

L'utilisateur parle.

Le système analyse sa réponse.

Si c'est correct :

« Bravo ! »

Si c'est presque correct :

« Tu es presque arrivé. Écoute encore une fois. »

Si c'est incorrect :

« Ce n'est pas grave. On recommence ensemble. »

Puis l'enseignant prononce correctement.

L'utilisateur recommence.

La correction doit être encourageante et humaine.

13. DÉTECTION DE LA COMPRÉHENSION

La fin d'une activité ne doit jamais être considérée automatiquement comme une compétence acquise.

Le moteur pédagogique doit déterminer si l'utilisateur a réellement compris.

Une compétence peut avoir plusieurs états :

NON APPRISE ;

EN APPRENTISSAGE ;

PRESQUE MAÎTRISÉE ;

MAÎTRISÉE ;

CONSOLIDÉE.

Exemple :

Mariam apprend « MA ».

Elle doit pouvoir :

reconnaître MA ;

entendre MA ;

prononcer MA ;

lire MA ;

reconnaître MA dans un mot ;

utiliser MA dans un assemblage.

Ce n'est qu'après plusieurs validations que la compétence est considérée comme maîtrisée.

14. RÉVISION INTELLIGENTE

Ne pas faire répéter inutilement les mêmes exercices.

Si Mariam maîtrise parfaitement :

MA, ME, MI, MO, MU

l'application doit avancer.

Mais elle doit également effectuer des révisions espacées pour éviter l'oubli.

Exemple :

apprentissage aujourd'hui ;

petite révision quelques jours plus tard ;

nouvelle vérification plus tard.

Si Mariam réussit :

la compétence devient progressivement consolidée.

Si elle échoue :

le système la réintroduit naturellement dans son parcours.

15. PARCOURS ADAPTATIF

Chaque utilisateur doit avoir un parcours différent selon ses difficultés.

Exemple :

Mariam confond souvent :

BA / PA

L'application détecte cette difficulté.

Elle crée automatiquement une petite séquence corrective.

Elle peut faire :

BA

PA

BA

PA

puis :

BABA

PAPA

etc.

Lorsque la confusion disparaît, le parcours continue.

Le système ne doit pas imposer exactement le même rythme à tout le monde.

16. APPRENTISSAGE DE L'ÉCRITURE

L'écriture doit commencer très tôt.

L'utilisateur doit pouvoir écrire avec son doigt sur l'écran.

Exemple :

Lettre A

L'enseignant montre :

« Regarde comment j'écris A. »

Une animation montre le mouvement du doigt.

Puis :

« Maintenant, c'est ton tour. »

L'utilisateur trace la lettre.

Le système analyse :

forme ;

direction ;

ordre du tracé ;

approximation ;

réussite.

Progression :

lettre → syllabe → mot → phrase

Exemple :

A

MA

MAMA

MAMAN

17. CALCUL

Le calcul doit être intégré progressivement.

Commencer par :

1 ;

2 ;

3 ;

4 ;

Puis progressivement :

1 à 10 ;

1 à 20 ;

1 à 100 ;

additions ;

soustractions ;

quantités ;

argent.

Le calcul doit être concret.

18. CALCUL DE LA VIE QUOTIDIENNE

Créer des situations réalistes.

Exemple :

L'écran montre :

1 000 F

Puis :

500 F

L'enseignant :

« Tu as 1 000 francs. Tu dépenses 500 francs. Il reste combien ? »

L'utilisateur répond vocalement.

L'application corrige.

Autres situations :

prix au marché ;

monnaie ;

quantité de nourriture ;

nombre de produits ;

dates ;

âge ;

numéro de téléphone ;

heures ;

petits budgets.

19. MODULE « VIE QUOTIDIENNE »

Cette partie est essentielle.

L'application ne doit pas apprendre uniquement des mots artificiels.

Elle doit apprendre les mots que l'utilisateur rencontre réellement.

Au marché

riz ;

huile ;

sel ;

poisson ;

prix ;

kilo ;

argent.

À l'hôpital

médecin ;

pharmacie ;

médicament ;

ordonnance ;

malade ;

rendez-vous.

Transport

taxi ;

bus ;

gare ;

départ ;

arrivée.

Téléphone

appel ;

message ;

contact ;

numéro.

Maison

porte ;

chambre ;

cuisine ;

eau ;

nourriture.

Administration

Progressivement :

nom ;

prénom ;

date ;

adresse ;

signature ;

numéro de téléphone.

L'objectif est que l'apprentissage devienne immédiatement utile.

20. ENSEIGNANT NUMÉRIQUE

L'enseignant est un élément central de l'application.

Il doit apparaître sous forme de vidéo ou d'avatar vidéo réaliste.

Il doit :

parler ;

sourire ;

regarder l'utilisateur ;

faire des gestes ;

pointer du doigt ;

montrer les éléments ;

écrire ;

se déplacer légèrement ;

réagir aux réponses ;

féliciter ;

encourager ;

parfois plaisanter.

Il doit donner l'impression d'être réellement présent.

21. STYLE DE L'ENSEIGNANT

L'enseignant doit être :

chaleureux ;

patient ;

naturel ;

africain dans son environnement et sa manière de communiquer ;

simple ;

accessible ;

jamais intimidant.

Il peut avoir un peu d'humour.

Exemple :

« Ah Mariam ! Tu as réussi ! »

ou :

« Eh ! Cette fois-ci tu m'as surpris ! 😂 »

ou :

« Allez, encore une fois. Écoute bien. »

Mais l'humour doit toujours rester bienveillant.

INTERDICTION

Ne jamais humilier l'utilisateur.

Ne jamais dire :

« Tu es nul » ;

« Tu ne comprends rien » ;

« C'est facile pourtant » ;

ou toute phrase pouvant créer de la honte.

L'objectif est de construire la confiance.

22. INTERFACE VISUELLE

L'interface doit être extrêmement simple.

Une personne qui ne sait pas lire doit pouvoir l'utiliser.

Les boutons doivent être :

grands ;

visuels ;

accompagnés d'une icône ;

accompagnés d'une voix.

Exemples :

🎙️ ÉCOUTER

👄 PARLER

👁️ LIRE

✍️ ÉCRIRE

🧮 COMPTER

Les textes doivent rester courts.

L'enseignant doit pouvoir lire les instructions à voix haute.

23. VIDÉO + INTERACTION

Ne pas créer de longues vidéos passives.

La séquence doit plutôt être :

VIDÉO

L'enseignant explique.

↓

INTERACTION

L'utilisateur répond.

↓

ANALYSE

L'application vérifie.

↓

CORRECTION

L'enseignant réagit.

↓

NOUVEL EXERCICE

Puis progression.

L'utilisateur doit être actif pendant toute la séance.

24. 15 MINUTES PAR JOUR

Le parcours quotidien doit être conçu autour d'environ :

15 MINUTES

La séance doit être amusante.

Exemple :

3 min : écouter et parler

4 min : syllabes / lecture

3 min : écriture

3 min : calcul / vie quotidienne

2 min : mini-défi

La durée peut varier légèrement selon le niveau, mais l'objectif est d'éviter les longues séances fatigantes.

25. LE « DÉFI DU JOUR »

Au lieu d'afficher simplement :

« Leçon 23 »

présenter :

🎯 TON DÉFI DU JOUR

Exemple :

« Aujourd'hui, nous allons apprendre 3 nouveaux mots. »

Puis les activités.

À la fin :

« Défi terminé ! »

Cela doit donner envie de revenir le lendemain.

26. GAMIFICATION SIMPLE ET HUMAINE

La gamification ne doit pas transformer l'application en jeu vidéo compliqué.

Utiliser :

félicitations ;

applaudissements ;

animations ;

étoiles ;

badges ;

progression ;

défis ;

petites récompenses visuelles.

L'objectif est :

« J'ai réussi ! »

et non :

« Je dois accumuler 10 000 points. »

27. FIN DE MODULE

Lorsqu'un module est réellement maîtrisé :

écran de célébration.

Exemple :

🎉 BRAVO MARIAM !

L'enseignant apparaît.

« Bravo Mariam ! Tu viens de terminer cette étape. Tu as appris beaucoup de choses. Continue comme ça ! »

Applaudissements.

Animation.

Puis :

CERTIFICAT

Le certificat est enregistré dans le profil.

28. CERTIFICATION PAR COMPÉTENCE

Un certificat ne doit être délivré que lorsque les compétences du module sont réellement maîtrisées.

Exemple :

CERTIFICAT — NIVEAU 1

Compétences validées :

reconnaître les lettres ;

reconnaître les sons ;

lire des syllabes simples ;

lire des mots simples ;

écrire des lettres ;

écrire des syllabes ;

reconnaître les premiers nombres.

Chaque certificat doit être sauvegardé dans le profil utilisateur.

29. PROFIL DE PROGRESSION

Le système doit conserver une progression détaillée.

Exemple :

MARIAM

Lecture :

Lettres : 100 %

Syllabes simples : 86 %

Sons complexes : 42 %

Mots : 31 %

Phrases : 15 %

Écriture :

Lettres : 92 %

Syllabes : 70 %

Mots : 41 %

Calcul :

Nombres : 80 %

Addition : 45 %

Soustraction : 25 %

Ces données servent principalement au moteur pédagogique.

L'utilisateur ne doit pas être confronté à des statistiques compliquées.

Il doit plutôt entendre :

« Tu progresses bien. »

30. HISTORIQUE COMPLET

Enregistrer automatiquement :

séances effectuées ;

durée ;

exercices ;

réponses ;

erreurs ;

compétences acquises ;

compétences à revoir ;

progression ;

certificats ;

interruptions ;

reprise des séances.

L'application doit savoir précisément ce que l'utilisateur a déjà fait.

31. REPRISE EXACTE

Si Mariam commence une activité et ferme l'application :

elle doit reprendre exactement au bon endroit.

Exemple :

Elle était à :

Exercice 4 / 7

Elle revient.

L'application :

« On continue l'exercice que tu avais commencé ? »

Pas de retour inutile au début.

32. SYSTÈME DE SAUVEGARDE

Chaque événement important doit être sauvegardé immédiatement localement.

Exemple :

utilisateur créé ;

nouvelle leçon commencée ;

réponse donnée ;

compétence maîtrisée ;

module terminé ;

certificat obtenu.

La sauvegarde locale doit être persistante.

La synchronisation serveur doit être automatique dès que possible.

Prévoir également une gestion robuste des conflits entre données locales et données serveur.

Une progression validée ne doit jamais être perdue.

33. TABLEAU DE BORD ADMINISTRATEUR

Prévoir à terme une interface permettant à l'administrateur de suivre :

nombre d'utilisateurs ;

nouveaux utilisateurs ;

utilisateurs actifs ;

progression moyenne ;

modules terminés ;

taux d'abandon ;

difficultés fréquentes ;

compétences les plus difficiles ;

durée moyenne des séances ;

certificats délivrés ;

utilisation hors connexion ;

synchronisations.

Les données doivent permettre d'améliorer continuellement la pédagogie.

34. CONCEPTION TECHNIQUE

L'application doit être conçue autour de plusieurs moteurs :

1. MOTEUR UTILISATEUR

Identité et profil.

2. MOTEUR PÉDAGOGIQUE

Programme, niveaux, modules, compétences.

3. MOTEUR DE MAÎTRISE

Détermine si une compétence est réellement acquise.

4. MOTEUR VOCAL

Écoute, reconnaissance et interaction vocale.

5. MOTEUR D'ÉCRITURE

Analyse des tracés et progression en écriture.

6. MOTEUR DE CONTENU

Vidéos, images, animations, sons, exercices.

7. MOTEUR DE PROGRESSION

Historique et adaptation du parcours.

8. MOTEUR LOCAL

Stockage hors connexion.

9. MOTEUR DE SYNCHRONISATION

Synchronisation automatique avec le serveur.

10. MOTEUR DE CERTIFICATION

Validation des compétences et certificats.

35. ARCHITECTURE LOGIQUE

APPLICATION MOBILE
        │
        ├── Enseignant numérique
        │      ├── Voix
        │      ├── Vidéo
        │      ├── Gestes
        │      └── Animations
        │
        ├── Moteur vocal
        │
        ├── Moteur écriture
        │
        ├── Moteur pédagogique
        │
        ├── Moteur de maîtrise
        │
        ├── Parcours utilisateur
        │
        └── BASE LOCALE
                 │
                 │ connexion disponible
                 ▼
           SYNCHRONISATION
                 │
                 ▼
              SERVEUR
                 │
          ┌──────┴──────┐
          │             │
       Données       Analytics
       utilisateurs


36. RÈGLES ABSOLUES DU PRODUIT

Le développeur doit respecter ces règles :

L'utilisateur ne doit pas avoir besoin de savoir lire pour utiliser l'application.

L'application doit parler naturellement.

Le français doit rester simple.

L'inscription doit être conversationnelle.

L'identité doit être persistante.

Le parcours doit être personnel.

La progression doit être sauvegardée immédiatement.

L'application doit fonctionner hors connexion.

La synchronisation doit être automatique.

Une progression validée ne doit jamais être perdue.

L'application doit savoir ce que l'utilisateur maîtrise réellement.

Ne pas faire répéter inutilement ce qui est déjà maîtrisé.

Réviser intelligemment ce qui risque d'être oublié.

Adapter le parcours aux difficultés de chaque utilisateur.

L'apprentissage doit être principalement vocal et visuel.

L'utilisateur doit pratiquer, pas seulement regarder des vidéos.

Les séances doivent être courtes.

L'objectif quotidien initial est environ 15 minutes.

L'application doit être amusante et motivante.

L'enseignant numérique doit être humain, chaleureux et naturel.

L'humour est autorisé, mais jamais l'humiliation.

Chaque étape importante doit donner un sentiment de réussite.

Les certificats doivent correspondre à de vraies compétences maîtrisées.

L'application doit enseigner la lecture, l'écriture ET le calcul.

L'apprentissage doit être lié aux situations de la vie quotidienne.

37. PRINCIPES DE CONCEPTION À NE JAMAIS PERDRE

Le produit final ne doit jamais devenir une application compliquée destinée à des personnes déjà alphabétisées.

Il faut toujours se poser cette question :

« Si une personne qui ne sait absolument pas lire ouvre cette application pour la première fois, peut-elle comprendre quoi faire sans demander de l'aide ? »

Si la réponse est non, l'interface ou le parcours doit être simplifié.

Deuxième question :

« Est-ce que l'utilisateur a l'impression d'être seul devant un logiciel ou d'apprendre avec quelqu'un ? »

L'objectif doit toujours être la deuxième réponse.

38. VISION À LONG TERME

Le projet doit commencer en français.

Mais l'architecture doit être pensée dès le départ pour pouvoir évoluer vers d'autres langues africaines et d'autres contextes culturels.

L'objectif à long terme est de construire une véritable plateforme africaine d'alphabétisation numérique capable d'accompagner :

adultes ;

jeunes ;

personnes âgées ;

populations rurales ;

personnes ayant abandonné l'école ;

centres d'alphabétisation ;

associations ;

ONG ;

programmes communautaires.

Le premier prototype doit toutefois rester simple et être testé avec de vrais utilisateurs avant d'élargir le produit.

39. MVP À CONSTRUIRE EN PREMIER

Ne pas essayer de construire toutes les fonctionnalités simultanément.

Le premier MVP doit permettre :

UTILISATEUR

première conversation ;

création automatique du profil ;

identification persistante ;

sauvegarde locale ;

fonctionnement hors connexion ;

synchronisation automatique.

PÉDAGOGIE

lettres ;

sons ;

premières syllabes ;

assemblage ;

premiers mots ;

première lecture ;

premiers exercices d'écriture ;

premiers nombres ;

premiers calculs.

IA

voix de l'enseignant ;

écoute de l'utilisateur ;

reconnaissance des réponses ;

correction ;

adaptation basique du parcours.

VISUEL

enseignant numérique ;

vidéos courtes ;

animations ;

pointage ;

démonstration de l'écriture ;

félicitations.

PROGRESSION

suivi des compétences ;

reprise exacte ;

historique ;

première certification.

40. MÉTHODE DE TEST

Le premier véritable utilisateur doit servir de laboratoire pédagogique.

Le parcours doit être testé avec une personne réelle qui correspond au public cible.

Observer :

ce qu'elle comprend spontanément ;

ce qu'elle ne comprend pas ;

les mots qu'elle connaît oralement ;

les sons qu'elle confond ;

les exercices qui la fatiguent ;

les exercices qui l'amusent ;

le temps pendant lequel elle reste concentrée ;

les moments où elle progresse rapidement ;

les moments où elle bloque.

Puis améliorer le moteur pédagogique.

Ensuite tester avec plusieurs personnes.

Le produit doit être construit à partir de la réalité des apprenants et non uniquement à partir d'une conception théorique.

41. RÉSULTAT ATTENDU

À terme, l'utilisateur doit pouvoir dire :

« Avant, je ne savais pas lire. Maintenant je peux lire un mot. »

Puis :

« Je peux lire une phrase. »

Puis :

« Je peux écrire. »

Puis :

« Je peux compter mon argent. »

Puis :

« Je peux lire certaines choses toute seule. »

C'est cette transformation qui doit être au cœur du produit.

42. INSTRUCTION FINALE AU DÉVELOPPEUR IA

Ne pas développer une simple application de cours.

Développer un accompagnateur numérique d'alphabétisation, capable de suivre une personne sur la durée.

L'expérience doit être :

humaine + vocale + visuelle + interactive + adaptative + hors connexion + persistante.

L'utilisateur ne doit pas avoir à comprendre le fonctionnement technique de l'application.

Il doit simplement ouvrir l'application et entendre :

« Bonjour. Je vais t'aider à apprendre à lire, à écrire et à compter. Comment tu t'appelles ? »

À partir de cette première phrase, l'application doit prendre en charge progressivement :

son identité → son parcours → son apprentissage → ses exercices → ses corrections → sa progression → ses révisions → ses réussites → ses certificats.

Le système doit toujours savoir :

Qui est cette personne ?

Où en est-elle ?

Qu'a-t-elle déjà appris ?

Qu'est-ce qu'elle maîtrise ?

Qu'est-ce qu'elle confond ?

Que doit-elle apprendre maintenant ?

Que doit-elle réviser ?

Et surtout :

L'utilisateur ne doit jamais avoir l'impression de recommencer à zéro.

L'application doit évoluer avec lui.

L'objectif final est de créer une solution d'alphabétisation tellement simple, humaine et bien pensée qu'une personne qui ne sait absolument pas lire puisse l'ouvrir seule, comprendre ce qu'on lui demande grâce à la voix, progresser chaque jour pendant environ 15 minutes et constater, étape après étape, qu'elle est réellement en train d'apprendre à lire, à écrire et à compter.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a39267e-4494-483b-947d-1f96674d4803).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
