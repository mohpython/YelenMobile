# Yelen Service — application mobile

Application Android / iOS de la boutique Yelen Service, construite avec
**Expo (React Native)**. Elle consomme la même API et la même base de données
que la boutique web `YelenV3` : un produit créé dans le back-office apparaît
immédiatement dans l'application.

## Ce que fait l'application

- **Boutique** : catalogue, recherche, filtres par catégorie, fiche produit.
- **Panier** : conservé sur l'appareil, même après fermeture de l'application.
- **Commande** : enregistrée en base *puis* envoyée sur WhatsApp, comme sur le
  site. Livraison gratuite à Bamako, frais régionaux selon la zone.
- **Compte client** : création avec nom + numéro WhatsApp + code à 4 chiffres,
  connexion, adresse par défaut, changement de code.
- **Mes commandes** : historique et suivi daté (en attente → confirmée → en
  préparation → en cours de livraison → livrée).

## Démarrage

L'API doit tourner : `cd ../YelenV3 && pnpm dev` (port 3010).

```bash
pnpm install
pnpm exec expo start          # puis « i » pour iOS, « a » pour Android
```

L'application devine l'adresse de l'API à partir du serveur Expo, donc un
téléphone sur le même Wi-Fi fonctionne sans configuration. Pour pointer
ailleurs (production), définir `EXPO_PUBLIC_API_URL` :

```bash
EXPO_PUBLIC_API_URL="https://boutique.yelen.ml" pnpm exec expo start
```

## Authentification

Le site garde la session dans un cookie ; l'application n'ayant pas de cookies,
elle envoie l'en-tête `x-yelen-client: mobile` et reçoit un **jeton** qu'elle
range dans le trousseau sécurisé de l'appareil (`expo-secure-store`). Le serveur
accepte ensuite `Authorization: Bearer <jeton>`. Même code PIN, même compte
client que sur le site.

## Code partagé avec le site

`src/lib/order-status.ts`, `phone.ts` et les formats de prix reprennent à
l'identique ceux de `YelenV3/src/lib/`. **Toute modification doit être reportée
des deux côtés** (libellés de statut, normalisation des numéros).

## Compiler l'application

Les dossiers `ios/` et `android/` sont générés et ne sont pas versionnés.

```bash
pnpm exec expo run:ios        # build local (Xcode requis)
npx eas-cli@latest build -p android --profile preview   # APK à installer
```

## Ce qui reste à faire

- **Notifications push** (Firebase) pour prévenir le client des changements de
  statut sans passer par WhatsApp.
- Favoris, codes promo et avis clients, absents du site comme de l'application.
