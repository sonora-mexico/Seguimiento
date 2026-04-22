// api/followers.js
// Obtiene los seguidores de un usuario y filtra los verificados

const crypto = require('crypto');

function oauthSign(method, url, params, consumerKey, consumerSecret, tokenKey, tokenSecret) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: tokenKey,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramString),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');

  return authHeader;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, apiSecret, accessToken, accessSecret, username, paginationToken } = req.body;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret || !username) {
    return res.status(400).json({ error: 'Faltan credenciales o usuario' });
  }

  try {
    // Paso 1: obtener el user_id del username
    const userUrl = `https://api.twitter.com/2/users/by/username/${username}`;
    const userAuth = oauthSign('GET', userUrl, {}, apiKey, apiSecret, accessToken, accessSecret);

    const userResp = await fetch(userUrl, {
      headers: { Authorization: userAuth }
    });
    const userData = await userResp.json();

    if (!userData.data) {
      return res.status(404).json({ error: 'Usuario no encontrado', detail: userData });
    }

    const userId = userData.data.id;

    // Paso 2: obtener seguidores con paginación
    const followersParams = {
      max_results: '1000',
      'user.fields': 'verified,verified_type,public_metrics,name,username',
    };
    if (paginationToken) followersParams.pagination_token = paginationToken;

    const queryString = new URLSearchParams(followersParams).toString();
    const followersUrl = `https://api.twitter.com/2/users/${userId}/followers?${queryString}`;

    const followersAuth = oauthSign('GET', followersUrl, {}, apiKey, apiSecret, accessToken, accessSecret);

    const followersResp = await fetch(followersUrl, {
      headers: { Authorization: followersAuth }
    });
    const followersData = await followersResp.json();

    if (!followersData.data) {
      return res.status(200).json({ verified: [], nextToken: null, total: 0 });
    }

    // Filtrar solo verificados (palomita azul oficial)
    const verified = followersData.data.filter(u =>
      u.verified === true || u.verified_type === 'blue' || u.verified_type === 'business' || u.verified_type === 'government'
    );

    return res.status(200).json({
      verified,
      nextToken: followersData.meta?.next_token || null,
      total: followersData.meta?.result_count || 0,
      userId,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno', detail: err.message });
  }
};
