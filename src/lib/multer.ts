import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    if (file && file.mimetype === "text/csv") {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
});

export default upload;
