Combien de crédits d'IA consommés ?
 - 11,6%

Choix faits :
    Garder la candidature avec un status WITHDRAWN.
    Un étudiant peut candidater à l'offre comme si c'était une nouvelle offre.
    Dès sélection ou refus.
    Dans le détail aussi.
    Facultatif.
    Commence par implémenter la EF-32

Résultats :
    L'IA comprends très bien les consignes et les features à implémenter, mais
    il faut tout de même vérifier que les fonctionnalités fonctionnent car elle se ne prends pas en compte 
    100% des cas possibles.
Modifications :
    Fichiers concernés
        Backend
            001_initial.sql
            permissions.ts
            offers.service.ts
            offers.controller.ts
            offers.repository.ts
            app.ts
        Frontend
            OffersPage.tsx
            OfferTable.tsx
            offers.service.ts
            useOffers.ts
        Tests existants à étendre
            offers.test.ts
            seed.test.ts
            OffersPage.test.tsx

Validation fonctionnelle :
    Candidature sur une offre publiée avec message facultatif
        Vérifié dans offers.test.ts
        Résultat observé : la candidature est créée correctement et le message facultatif est accepté.
    Blocage d’une double candidature active sur la même offre
        Vérifié dans offers.test.ts
        Résultat observé : le backend refuse la deuxième candidature tant que la première est en cours.
    Réouverture de candidature après sélection ou refus
        Vérifié dans offers.test.ts
        Résultat observé : après un statut terminal, une nouvelle candidature est autorisée.
    Consultation de ses candidatures par l’étudiant
        Vérifié dans offers.test.ts
        Résultat observé : l’étudiant voit bien ses candidatures et leur statut.
    Retrait d’une candidature active
        Vérifié dans offers.test.ts
        Résultat observé : le statut passe en WITHDRAWN sans suppression du dossier.
    UI de candidature côté frontend
        Vérifié dans OffersPage.test.tsx
        Résultat observé : le bouton Candidater s’affiche, le message facultatif est saisi, puis la candidature est envoyée.
    Cas particulier de nettoyage React / signal aborté
        Vérifié dans OffersPage.test.tsx
        Résultat observé : l’abort de fetch causé par le cleanup React ne doit pas afficher une erreur utilisateur.
Tests et commandes :
    Les tests ajoutés/ajustés concernent surtout les points de régression et le comportement métier :

        offers.test.ts
            ajout du couvert sur EF-32 / EF-33
            validation de la candidature, de la double candidature, du statut WITHDRAWN et de la consultation
        OffersPage.test.tsx
            ajout d’un test sur le message facultatif
            ajout d’un test de non-régression sur l’abort du fetch (“signal is aborted without reason”)
Exemple de comportement couvert par un test :

“un étudiant peut candidater à une offre publiée avec un message facultatif”
Ce cas est couvert par le test “permet d’ajouter un message facultatif avant la candidature” dans OffersPage.test.tsx, et la cohérence métier côté backend est validée par offers.test.ts.