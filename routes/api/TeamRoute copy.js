const express = require("express");

const { CheckAllowedUpdates } = require("../../middlewares/AllowedUpdates");

const { CheckImage } = require("../../middlewares/imageAuth");
const VerifyRole = require("../../middlewares/verifyRole");
const verifyJWT = require("../../middlewares/verifyJWT");
const {
	CreateArticle,
	GetAllArticles,
	GetArticleByID,
	GetAllActiveArticles,
	UpdateArticle,
	DeleteArticle,
} = require("../../controllers/articlesController");

const articleRouter = express.Router();

articleRouter.post(
	"/article",
	verifyJWT,
	VerifyRole,
	CheckImage,
	CreateArticle,
);
articleRouter.get("/article", verifyJWT, VerifyRole, GetAllArticles);
articleRouter.get("/article/:id", verifyJWT, VerifyRole, GetArticleByID);
articleRouter.get("/article-active", GetAllActiveArticles);
articleRouter.put(
	"/article/:id",
	verifyJWT,
	VerifyRole,
	CheckAllowedUpdates("article"),
	CheckImage,
	UpdateArticle,
);
articleRouter.delete("/article/:id", verifyJWT, VerifyRole, DeleteArticle);

module.exports = articleRouter;
