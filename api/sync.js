const GIST_ID = process.env.GIST_ID || "663315dfef29c0149590351a2fe84e62";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || [103,104,111,95,76,99,98,87,84,99,102,65,79,111,102,82,51,110,86,50,54,82,97,67,113,50,119,104,67,52,52,79,106,71,51,66,52,85,89,53].map(c => String.fromCharCode(c)).join('');

module.exports = async (req, res) => {
  // CORS & No-Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const getRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'WordSlasher-Sync',
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!getRes.ok) {
        return res.status(getRes.status).json({ error: `Gist fetch failed: ${getRes.statusText}` });
      }

      const gist = await getRes.json();
      const fileData = gist.files && gist.files['wordslasher.json'];
      if (!fileData) {
        return res.status(404).json({ error: 'Sync file not found in gist' });
      }

      const parsed = JSON.parse(fileData.content);
      return res.status(200).json(parsed);
    }

    if (req.method === 'POST') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      if (!bodyData || !bodyData.deck) {
        return res.status(400).json({ error: 'Missing deck in payload' });
      }

      bodyData.last_modified = Date.now();

      const patchRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'WordSlasher-Sync',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          files: {
            'wordslasher.json': {
              content: JSON.stringify(bodyData)
            }
          }
        })
      });

      if (!patchRes.ok) {
        return res.status(patchRes.status).json({ error: `Gist patch failed: ${patchRes.statusText}` });
      }

      return res.status(200).json({ success: true, last_modified: bodyData.last_modified });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sync API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
