const fs = require('fs');
const path = require('path');
const { cloudinary, isConfigured, getOptimizedUrl } = require('../config/cloudinary');

const uploadImage = async (file, folder = 'stepup/products') => {
  if (isConfigured && file) {
    try {
      const result = await cloudinary.uploader.upload(file.path || file, {
        folder,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto'
      });
      // Delete temporary local file if created by multer diskStorage
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (err) {
      console.error('[Cloudinary] Upload failed, falling back to local storage:', err.message);
    }
  }

  // Local fallback storage
  if (file && file.filename) {
    return {
      url: `/uploads/${file.filename}`,
      publicId: `local_${Date.now()}`
    };
  }

  // Placeholder fallback
  return {
    url: '/img/placeholder-shoe.svg',
    publicId: null
  };
};

const uploadVideo = async (file, folder = 'stepup/videos') => {
  if (isConfigured && file) {
    try {
      const result = await cloudinary.uploader.upload(file.path || file, {
        folder,
        resource_type: 'video'
      });
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (err) {
      console.error('[Cloudinary] Video upload failed, falling back to local storage:', err.message);
    }
  }

  if (file && file.filename) {
    return {
      url: `/uploads/${file.filename}`,
      publicId: `local_vid_${Date.now()}`
    };
  }

  return { url: null, publicId: null };
};

const deleteMedia = async (publicId, resourceType = 'image') => {
  if (isConfigured && publicId && !publicId.startsWith('local_')) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.error('[Cloudinary] Media delete error:', err.message);
    }
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteMedia,
  getOptimizedUrl
};
