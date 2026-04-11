# 🌿 ZEISKIN — Site E-Commerce Full-Stack

Boutique en ligne de soins corporels naturels.  
Stack : **Node.js + Express + MongoDB Atlas + HTML/CSS/JS**

---

## 🚀 Démarrage rapide

### Étape 1 — Configurer MongoDB Atlas (GRATUIT)

1. Allez sur [https://mongodb.com/atlas](https://mongodb.com/atlas) et créez un compte gratuit
2. Créez un **Cluster gratuit (M0)**
3. Créez un **utilisateur de base de données** (copiez le mot de passe)
4. Dans **Network Access**, ajoutez `0.0.0.0/0` pour autoriser toutes les IP
5. Cliquez **Connect** → **Drivers** → copiez la chaîne de connexion

### Étape 2 — Configurer le fichier .env

Ouvrez le fichier `.env` et remplacez :
```env
MONGO_URI=mongodb+srv://VOTRE_USER:VOTRE_PASSWORD@cluster0.xxxxx.mongodb.net/zeiskin?retryWrites=true&w=majority
JWT_SECRET=zeiskin_secret_key_2024_very_secure
PORT=5000
```

### Étape 3 — Initialiser la base de données

```bash
npm run seed
```

Cela crée :
- **Admin** : username=`admin` | password=`Zeiskin@2024`
- **3 Catégories** : Soins Lèvres, Soins Corps, Coffrets & Kits
- **8 Produits** ZEISKIN avec descriptions complètes
- **Paramètres** par défaut (WhatsApp, etc.)

### Étape 4 — Lancer le serveur

```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start
```

Le site est accessible sur : **http://localhost:5000**

---

## 📋 Pages disponibles

| URL | Description |
|-----|-------------|
| `http://localhost:5000/` | Page d'accueil |
| `http://localhost:5000/shop.html` | Catalogue produits |
| `http://localhost:5000/product.html?slug=...` | Fiche produit |
| `http://localhost:5000/admin/` | Login admin |
| `http://localhost:5000/admin/dashboard.html` | Dashboard (stats) |
| `http://localhost:5000/admin/products.html` | Gestion produits |
| `http://localhost:5000/admin/categories.html` | Gestion catégories |
| `http://localhost:5000/admin/settings.html` | Paramètres |

---

## 🔐 Accès Admin

- **URL** : `http://localhost:5000/admin/`
- **Identifiant** : `admin`
- **Mot de passe** : `Zeiskin@2024`

---

## 📱 WhatsApp Checkout

Quand un client clique "Commander via WhatsApp", le système :
1. Enregistre la commande dans la base de données (pour les stats)
2. Génère un message pré-rempli avec les articles, quantités et total
3. Ouvre WhatsApp avec le numéro `+221 70 304 61 52`

---

## 🌍 Déploiement sur Railway (GRATUIT)

1. Créez un compte sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Ajoutez les variables d'environnement dans Railway :
   - `MONGO_URI` = votre URI MongoDB Atlas
   - `JWT_SECRET` = votre clé secrète
   - `NODE_ENV` = `production`
4. Railway génère automatiquement une URL publique ! 🎉

---

## 📁 Structure du projet

```
zeiskin/
├── server/           # Backend Node.js
│   ├── config/      # Connexion MongoDB
│   ├── models/      # Schémas Mongoose
│   ├── routes/      # API REST
│   ├── middleware/  # Auth JWT
│   ├── index.js     # Point d'entrée
│   └── seed.js      # Initialisation BDD
├── public/          # Frontend
│   ├── css/         # Styles
│   ├── js/          # Scripts
│   ├── admin/       # Pages admin
│   ├── index.html   # Accueil
│   ├── shop.html    # Catalogue
│   └── product.html # Fiche produit
├── uploads/         # Images uploadées (auto-créé)
├── .env             # Variables d'environnement
└── package.json
```

---

## ✉ Contact

- Email : Traorezainab51@gmail.com
- WhatsApp boutique : +221 70 304 61 52
