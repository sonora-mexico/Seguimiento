// api/follow.js
// Sigue a un usuario usando la API v2 de X

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

  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { apiKey, apiSecret, accessToken, accessSecret, sourceUserId, targetUserId } = req.body;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret || !sourceUserId || !targetUserId) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  try {
    const url = `https://api.twitter.com/2/users/${sourceUserId}/following`;
    const body = JSON.stringify({ target_user_id: targetUserId });

    const authHeader = oauthSign('POST', url, {}, apiKey, apiSecret, accessToken, accessSecret);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    // Manejar rate limit
    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset');
      return res.status(429).json({
        error: 'rate_limit',
        resetAt: resetTime ? parseInt(resetTime) * 1000 : null,
      });
    }

    if (response.status === 403 && data.detail?.includes('following')) {
      // Ya lo sigues
      return res.status(200).json({ already_following: true, data });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error de X API', detail: data });
    }

    return res.status(200).json({
      success: true,
      following: data.data?.following,
      pending_follow: data.data?.pending_follow,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno', detail: err.message });
  }
};
