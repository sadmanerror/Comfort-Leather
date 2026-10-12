const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp|gif|svg/;
  const allowedVideoTypes = /mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimetype = file.mimetype;

  if (allowedImageTypes.test(ext) || allowedImageTypes.test(mimetype)) {
    return cb(null, true);
  }
  if (allowedVideoTypes.test(ext) || allowedVideoTypes.test(mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Unsupported file format. Please upload JPG, PNG, WEBP images or MP4 videos.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 MB max (for videos; images checked in controller if needed)
  }
});

module.exports = upload;
