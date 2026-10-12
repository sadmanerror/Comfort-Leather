const cloudinary = require('cloudinary').v2;
const env = require('./env');

if (env.CLOUDINARY.IS_CONFIGURED) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY.CLOUD_NAME,
    api_key: env.CLOUDINARY.API_KEY,
    api_secret: env.CLOUDINARY.API_SECRET,
    secure: true
  });
}

/**
 * Returns optimized image URL using Cloudinary transformations
 * or fallback placeholder URL if Cloudinary is not used/configured
 */
const getOptimizedUrl = (url, { width = 600, quality = 'auto', format = 'auto', crop = 'scale' } = {}) => {
  if (!url) return '/img/placeholder-shoe.svg';

  // If already a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    const transformation = `f_${format},q_${quality},w_${width},c_${crop}`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  // If external or local URL, return as-is
  return url;
};

module.exports = {
  cloudinary,
  isConfigured: env.CLOUDINARY.IS_CONFIGURED,
  getOptimizedUrl
};
