const https = require('https');
const { buildItemImageSvg } = require('../services/mediaService');

/**
 * Proxies external images so the browser can display them without CORS or ORB
 * problems.
 */
const proxyImage = (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'url query parameter is required' });
  }

  https
    .get(imageUrl, (response) => {
      if (response.statusCode === 200) {
        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.pipe(res);
      } else {
        res.status(response.statusCode).send('Image not found');
      }
    })
    .on('error', (error) => {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    });
};

/**
 * Builds the SVG illustration for an item and sends it as an image response.
 */
const getItemImage = (req, res) => {
  const { itemName } = req.params;
  const svg = buildItemImageSvg(itemName);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
};

module.exports = {
  proxyImage,
  getItemImage,
};