# Auto Follow Verificados — X

Sigue automáticamente a tus seguidores verificados en X usando la API oficial.

## Estructura del proyecto

```
x-auto-follow/
├── api/
│   ├── followers.js   → Obtiene seguidores verificados (serverless function)
│   └── follow.js      → Sigue a un usuario (serverless function)
├── public/
│   └── index.html     → App frontend
├── package.json
├── vercel.json
└── README.md
```

## Cómo desplegar en Vercel (gratis)

### 1. Requisitos
- Cuenta en [vercel.com](https://vercel.com) (gratis)
- Cuenta en [developer.twitter.com](https://developer.twitter.com) con una app creada
- Permisos **Read and Write** en tu app de X

### 2. Subir a GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/x-auto-follow.git
git push -u origin main
```

### 3. Deploy en Vercel
1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta tu repositorio de GitHub
3. Framework Preset: **Other**
4. Haz clic en **Deploy**
5. En ~30 segundos tendrás tu URL (ej: `https://x-auto-follow.vercel.app`)

### 4. (Opcional) Variables de entorno
Si quieres pre-llenar las credenciales en Vercel para tus usuarios:

En Vercel → Settings → Environment Variables, agrega:
```
X_API_KEY       = tu_api_key
X_API_SECRET    = tu_api_secret
X_ACCESS_TOKEN  = tu_access_token
X_ACCESS_SECRET = tu_access_secret
X_USERNAME      = tu_usuario_sin_arroba
```

## Cómo obtener las credenciales de X

1. Ve a [developer.twitter.com](https://developer.twitter.com)
2. Crea un proyecto y una app (gratis con el plan Basic)
3. En tu app → **Keys and Tokens**
4. Genera **API Key & Secret** y **Access Token & Secret**
5. Asegúrate de que el modo de la app sea **Read and Write**

## Límites de la API de X

| Límite | Valor |
|--------|-------|
| Follows por día | ~400 |
| Follows por 15 min | ~15 |
| Seguidores por página | 1,000 |
| Páginas máximas | 20 (20,000 seguidores) |

Esta app respeta todos los límites usando lotes configurables con pausas entre ellos.

## Licencia
MIT — Úsalo libremente.
