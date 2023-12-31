const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { Prisma } = require("@prisma/client");
const { HandleError } = require("../middlewares/ErrorHandler");
const fs = require("fs");
const { json } = require("express");
require("dotenv").config;

const CreateArticle = async (req, res) => {
	try {
		const image = req.file;
		// const data = [{}];
		const data = req.body;
		if (image) {
			data.Image = {
				create: {
					URL: image.path,
					Alt: image?.originalname,
					Size: image.size,
					Type: image.mimetype,
					user: undefined,
				},
			};
		}

		// data.ActiveStatus =
		data.MinRead = parseInt(data.MinRead);
		if (data.ActiveStatus) {
			data.ActiveStatus =
				data.ActiveStatus?.toLowerCase?.() === "true"
					? data.ActiveStatus?.toLowerCase?.() === "true"
					: false;
		}
		// const splitStr = (x) => {
		// 	const y = x.split(":");
		// 	return { [y[0].trim()]: y[1].trim() };
		// };
		// data.Articles_Translation.map((item) => {
		// 	item = splitStr(item);
		// });
		// console.log(data.Articles_Translation);
		const Article = await prisma.articles.create({
			data: {
				MinRead: data.MinRead,
				ActiveStatus: data.ActiveStatus,
				Articles_Translation: {
					createMany: {
						data: data.Articles_Translation,
					},
				},
				Image: data?.Image,
				User: {
					connect: {
						id: data.AuthorID,
					},
				},
			},
			include: {
				Image: true,
				Articles_Translation: {
					include: {
						Language: true,
					},
				},
			},
		});
		return res.status(201).send(Article);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return res.status(404).send("Record Doesn't Exist!");
			} else if (error.code === "P2021") {
				return res.status(404).send("Table Doesn't Exist!");
			} else if (error.code === "P2002") {
				return res.status(404).send("Unique constraint failed, Field Exist!");
			} else if (error.code === "P2003") {
				return res
					.status(404)
					.send(
						"Foreign key constraint failed, Connection Field Doesn't Exist!",
					);
			}
		}
		return res.status(500).send(error.message);
	}
};

const GetAllArticles = async (req, res) => {
	try {
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Articles, count] = await prisma.$transaction([
			prisma.articles.findMany({
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					User: {
						include: {
							Image: true,
							Team: {
								include: {
									Image: true,
								},
							},
							Address: {
								include: {
									Address_Translation: {
										include: {
											Language: true,
										},
									},
								},
							},
						},
					},
					Image: true,
					Articles_Translation: {
						include: { Language: true },
					},
				},
			}),
			prisma.articles.count(),
		]);

		if (!Articles) {
			return res.status(404).send("No Articles Were Found!");
		}
		res.status(200).json({
			count,
			Articles,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetAllActiveArticles = async (req, res) => {
	try {
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Articles, count] = await prisma.$transaction([
			prisma.articles.findMany({
				skip: offset || undefined,
				take: limit || undefined,
				where: { ActiveStatus: true },
				include: {
					User: {
						include: {
							Image: true,
							Team: {
								include: {
									Image: true,
								},
							},
							Address: {
								include: {
									Address_Translation: {
										include: {
											Language: true,
										},
									},
								},
							},
						},
					},
					Image: true,
					Articles_Translation: {
						include: { Language: true },
					},
				},
			}),
			prisma.articles.count({ where: { ActiveStatus: true } }),
		]);
		if (!Articles) {
			return res.status(404).send("No Articles Were Found!");
		}
		res.status(200).json({
			count,
			Articles,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetArticleByID = async (req, res) => {
	try {
		const id = req.params.id;

		const Article = await prisma.articles.findUnique({
			where: { id: id },
			include: {
				User: {
					include: {
						Image: true,
						Team: {
							include: {
								Image: true,
							},
						},
						Address: {
							include: {
								Address_Translation: {
									include: {
										Language: true,
									},
								},
							},
						},
					},
				},
				Image: true,
				Articles_Translation: {
					include: { Language: true },
				},
			},
		});
		if (!Article) {
			return res.status(404).send("No Article Were Found!");
		}
		res.status(200).send(Article);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
const GetArticleByUserID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Articles, count] = await prisma.$transaction([
			prisma.articles.findMany({
				skip: offset || undefined,
				take: limit || undefined,
				where: {
					usersID: id,
				},
				include: {
					User: {
						include: {
							Image: true,
							Team: {
								include: {
									Image: true,
								},
							},
							Address: {
								include: {
									Address_Translation: {
										include: {
											Language: true,
										},
									},
								},
							},
						},
					},
					Image: true,
					Articles_Translation: {
						include: { Language: true },
					},
				},
			}),
			prisma.articles.count({
				where: {
					usersID: id,
				},
			}),
		]);
		if (!Articles) {
			return res.status(404).send("No Article Were Found For this User!");
		}
		res.status(200).json({
			count,
			Articles,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
// Search Articles
const ArticleSearch = async (req, res) => {
	try {
		const searchTerm = req.params.searchTerm;
		console.log("query: ", searchTerm);
		const query = {
			OR: [
				{
					Articles_Translation: {
						some: {
							OR: [
								{
									Title: {
										contains: searchTerm,
										mode: "insensitive",
									},
								},
								{
									Description: {
										contains: searchTerm,
										mode: "insensitive",
									},
								},
								{
									Caption: {
										contains: searchTerm,
										mode: "insensitive",
									},
								},
							],
						},
					},
				},
				{
					User: {
						OR: [
							{
								Name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
							{
								Address: {
									Address_Translation: {
										some: {
											Name: {
												contains: searchTerm,
												mode: "insensitive",
											},
										},
									},
								},
							},
						],
					},
				},
			],
		};
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Articles, count] = await prisma.$transaction([
			prisma.articles.findMany({
				where: query,
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Articles_Translation: {
						include: { Language: true },
					},
					User: {
						include: {
							Image: true,
							Team: {
								include: {
									Image: true,
								},
							},
							Address: {
								include: {
									Address_Translation: {
										include: {
											Language: true,
										},
									},
								},
							},
						},
					},
					Image: true,
				},
			}),
			prisma.articles.count({
				where: query,
			}),
		]);
		if (!Articles) {
			return res.status(404).send("No Article Were Found For this User!");
		}
		res.status(200).json({
			count,
			Articles,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// ToDO: Change update articles
const UpdateArticle = async (req, res) => {
	try {
		const id = req.params.id;
		const ArticleData = req.body;
		const updates = Object.keys(req.body);
		const image = req?.file;
		const Selected = { id: true };
		updates.forEach((item) => {
			if (item !== "AuthorID") Selected[item] = true;
		});
		if (image) {
			Selected["Image"] = true;
		} else {
			var index = updates.indexOf("Image");
			if (index !== -1) {
				updates.splice(index, 1);
			}
		}
		const data = await prisma.articles.findUnique({
			where: { id: id },
			select: Selected,
		});
		if (!data) {
			return res.status(404).send("Article was not Found!");
		}
		updates.forEach((update) => (data[update] = req.body[update]));
		data.MinRead = parseInt(data.MinRead);
		if (image) {
			if (data.Image !== null) {
				if (fs.existsSync(`.${data.Image.URL}`)) {
					fs.unlinkSync(`.${data.Image.URL}`);
				}
				await prisma.images.delete({ where: { id: data.Image.id } });
			}
			data.Image = {
				create: {
					URL: image.path,
					Alt: image?.originalname,
					Size: image.size,
					Type: image.mimetype,
					teamID: undefined,
				},
			};
		}
		if (updates.includes("ActiveStatus")) {
			if (req.body.ActiveStatus.toLowerCase() === "false") {
				data.ActiveStatus = false;
			} else {
				data.ActiveStatus = true;
			}
		}
		const result = await prisma.$transaction(async (prisma) => {
			data.Articles_Translation &&
				data.Articles_Translation.map(async (item) => {
					{
						await prisma.articles_Translation.updateMany({
							where: {
								AND: [{ languagesID: item.languagesID }, { articlesId: id }],
							},
							data: {
								Title: item?.Title,
								Description: item?.Description,
								Caption: item?.Caption,
							},
						});
					}
				});
			const UpdatedArticle = await prisma.articles.update({
				where: { id: id },
				data: {
					MinRead: data?.MinRead || undefined,
					ActiveStatus: data?.ActiveStatus || undefined,
					Image: data?.Image || undefined,
				},
				include: {
					Image: true,
					User: {
						include: {
							Image: true,
							Team: {
								include: {
									Image: true,
								},
							},
							Address: {
								include: {
									Address_Translation: {
										include: {
											Language: true,
										},
									},
								},
							},
						},
					},
					Articles_Translation: {
						include: {
							Language: true,
						},
					},
				},
			});

			return UpdatedArticle;
		});

		return res.status(200).json({
			Message: "Updated successfully",
			result,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
// ToDO : check deleting conditions
const DeleteArticle = async (req, res) => {
	try {
		const id = req.params.id;
		const Article = await prisma.articles.findFirst({
			where: { id: id },
			include: {
				Image: true,
				Articles_Translation: {
					include: {
						Language: true,
					},
				},
			},
		});
		const imageURL = Article.Image?.URL;
		const imageID = Article.Image?.id;
		let isImageDeleted = false;
		if (imageID !== undefined) {
			if (fs.existsSync(`.${imageURL}`)) {
				fs.unlinkSync(`.${imageURL}`);
				isImageDeleted = true;
			} else {
				isImageDeleted = true;
			}
		} else {
			if (Article.Articles_Translation.length > 0) {
				console.log("len: ", Article.Articles_Translation.length);
				await prisma.articles_Translation.deleteMany({
					where: { articlesId: id },
				});
			}
			await prisma.articles.delete({ where: { id: Article.id } });
		}
		if (isImageDeleted) {
			console.log("Deleting ...");
			await prisma.images.delete({ where: { id: imageID } });
			if (Article.Articles_Translation.length > 0) {
				console.log("len: ", Article.Articles_Translation.length);
				await prisma.articles_Translation.deleteMany({
					where: { articlesId: id },
				});
			}
			await prisma.articles.delete({ where: { id: Article.id } });
		}
		// console.log("Role: ", Role);
		res.status(200).json({
			"Image Deleted: ": imageURL,
			Article,
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return res.status(404).send("Record Doesn't Exist!");
			} else if (error.code === "P2021") {
				return res.status(404).send("Table Doesn't Exist!");
			}
		}
		return res.status(500).send(error.message);
	}
};

module.exports = {
	CreateArticle,
	GetAllArticles,
	GetArticleByID,
	ArticleSearch,
	GetArticleByUserID,
	GetAllActiveArticles,
	UpdateArticle,
	DeleteArticle,
};
