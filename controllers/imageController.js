const multer = require("multer");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/images/");
	},
	filename: function (req, file, cb) {
		cb(null, Math.floor(new Date().getTime() / 1000) + "-" + file.originalname);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 1024 * 1024 * 6,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
			cb(null, false);
			return cb(new Error("Please upload a (jpg or jpeg or Png) image "));
		}
		if (file.size > 1024 * 1024 * 6) {
			cb(null, false);
			return cb(new multer.MulterError("File is Larger than 6 MB "));
		}
		cb(undefined, true);
	},
}).single("image");
module.exports = { upload };