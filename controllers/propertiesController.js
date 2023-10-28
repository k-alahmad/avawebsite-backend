const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const {
	Prisma,
	Purpose,
	RentFrequency,
	CompletionStatus,
} = require("@prisma/client");
const { HandleError } = require("../middlewares/ErrorHandler");
const fs = require("fs");
const { json } = require("express");
require("dotenv").config;

const CreateProperty = async (req, res) => {
	try {
		const images = req.files;

		const data = req.body;
		data.Images = [];
		if (images) {
			images.map((image) => {
				data.Images.push({
					URL: image.path,
					Alt: image?.originalname,
					Size: image.size,
					Type: image.mimetype,
					user: undefined,
				});
			});
		}
		data.Price = parseFloat(data.Price);
		data.Bedrooms = parseInt(data.Bedrooms);
		data.BalconySize = parseFloat(data.BalconySize);
		data.RentMin = parseFloat(data.RentMin);
		data.RentMax = parseFloat(data.RentMax);
		data.Longitude = parseFloat(data.Longitude);
		data.Latitude = parseFloat(data.Latitude);
		data.Area = parseFloat(data.Area);
		if (data.ActiveStatus) {
			if (req.body.ActiveStatus.toLowerCase() === "false") {
				data.ActiveStatus = false;
			} else {
				data.ActiveStatus = true;
			}
		}
		if (data.Bacloney) {
			if (req.body.Bacloney.toLowerCase() === "false") {
				data.Bacloney = false;
			} else {
				data.Bacloney = true;
			}
		}
		let amenities = [];
		if (data.Aminities) {
			data.Aminities.forEach((item) =>
				amenities.push({
					id: item,
				}),
			);
		}
		const Property = await prisma.property.create({
			data: {
				Price: data.Price,
				Bedrooms: data.Bedrooms,
				Bacloney: data.Bacloney,
				BalconySize: data.BalconySize,
				RentMin: data.RentMin,
				RentMax: data.RentMax,
				Handover: data.Handover,
				Area: data.Area,
				FurnishingStatus: data.FurnishingStatus,
				VacantStatus: data.VacantStatus,
				Longitude: data.Longitude,
				Latitude: data.Latitude,
				ActiveStatus: data?.ActiveStatus,
				RentFrequency: data.RentFrequency,
				CompletionStatus: data.CompletionStatus,
				Purpose: data.Purpose,
				PermitNumber: data.PermitNumber,
				DEDNo: data.DEDNo,
				ReraNo: data.ReraNo,
				BRNNo: data.BRNNo,
				Aminities: data?.Aminities && {
					connect: amenities,
				},
				Property_Translation: {
					createMany: {
						data: data.Property_Translation,
					},
				},
				Developer: data?.DeveloperID && {
					connect: {
						id: data?.DeveloperID,
					},
				},
				Category: data?.CategoryID && {
					connect: {
						id: data?.CategoryID,
					},
				},
				Address: data?.AddressID && {
					connect: {
						id: data?.AddressID,
					},
				},
				Images: {
					createMany: {
						data: data.Images,
					},
				},
			},
			include: {
				Images: true,
				Aminities: {
					include: {
						Image: true,
						Aminities_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Category: {
					include: {
						Category_Translation: {
							include: {
								Language: true,
							},
						},
						Parent: true,
					},
				},
				Developer: {
					include: {
						Developer_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Address: {
					include: {
						Address_Translation: {
							include: { Language: true },
						},
					},
				},
				Property_Translation: {
					include: {
						Language: true,
					},
				},
			},
		});
		return res.status(201).send(Property);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025") {
				return res.status(404).send("Record Doesn't Exist!");
			} else if (error.code === "P2021") {
				return res.status(404).send("Table Doesn't Exist!");
			} else if (error.code === "P2002") {
				return res.status(404).send(error.message);
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

const GetAllProperties = async (req, res) => {
	try {
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count(),
		]);

		if (!Properties) {
			return res.status(404).send("No Properties Were Found!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetAllActiveProperties = async (req, res) => {
	try {
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { ActiveStatus: true },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({ where: { ActiveStatus: true } }),
		]);
		if (!Properties) {
			return res.status(404).send("No Properties Were Found!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
//Get Property By ID
const GetPropertyByID = async (req, res) => {
	try {
		const id = req.params.id;

		const Property = await prisma.property.findUnique({
			where: { id: id },
			include: {
				Images: true,
				Aminities: {
					include: {
						Image: true,
						Aminities_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Category: {
					include: {
						Category_Translation: {
							include: {
								Language: true,
							},
						},
						Parent: true,
					},
				},
				Developer: {
					include: {
						Developer_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Address: {
					include: {
						Address_Translation: {
							include: { Language: true },
						},
					},
				},
				Property_Translation: {
					include: {
						Language: true,
					},
				},
			},
		});
		if (!Property) {
			return res.status(404).send("No Property Were Found!");
		}
		res.status(200).send(Property);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// Get Property by Category ID
const GetPropertiesByCategoryID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { categoryId: id },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({ where: { categoryId: id } }),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Properties Were Found Under This Category!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// Get Active Properties By Category ID
const GetActivePropertiesByCategoryID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { AND: [{ ActiveStatus: true }, { categoryId: id }] },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({
				where: { AND: [{ ActiveStatus: true }, { categoryId: id }] },
			}),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Active Properties Were Found Under This Category!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
// Get Property by Developer ID
const GetPropertiesByDeveloperID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { developerId: id },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({ where: { developerId: id } }),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Properties Were Found Under This Developer!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// Get Active Properties By Address ID
const GetActivePropertiesByDeveloperID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { AND: [{ developerId: id }, { ActiveStatus: true }] },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({
				where: { AND: [{ developerId: id }, { ActiveStatus: true }] },
			}),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Active Properties Were Found Under This Developer!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// Get Property by Category ID
const GetPropertiesByAddressID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { addressId: id },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({ where: { addressId: id } }),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Properties Were Found Under This Address!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

// Get Active Properties By Address ID
const GetActivePropertiesByAddressID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: { AND: [{ addressId: id }, { ActiveStatus: true }] },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({
				where: { AND: [{ addressId: id }, { ActiveStatus: true }] },
			}),
		]);
		if (!Properties) {
			return res
				.status(404)
				.send("No Active Properties Were Found Under This Address!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
//Search Property
const PropertySearch = async (req, res) => {
	try {
		const searchTerm = req.params.searchTerm;
		console.log("query: ", searchTerm);

		const query = {
			OR: [
				{
					Handover: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					FurnishingStatus: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					VacantStatus: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					PermitNumber: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					DEDNo: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					ReraNo: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					BRNNo: {
						contains: searchTerm,
						mode: "insensitive",
					},
				},
				{
					Property_Translation: {
						some: {
							OR: [
								{
									Name: {
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
							],
						},
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
				{
					Developer: {
						Developer_Translation: {
							some: {
								Name: {
									contains: searchTerm,
									mode: "insensitive",
								},
							},
						},
					},
				},
				{
					Category: {
						Category_Translation: {
							some: {
								OR: [
									{
										Name: {
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
								],
							},
						},
					},
				},
				{
					Aminities: {
						some: {
							OR: [
								{
									Aminities_Translation: {
										some: {
											OR: [
												{
													Name: {
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
											],
										},
									},
								},
							],
						},
					},
				},
				{
					Developer: {
						Developer_Translation: {
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
		};
		if (searchTerm.toLowerCase() === Purpose.Rent.toLowerCase()) {
			query.OR.push({
				Purpose: Purpose.Rent,
			});
		} else if (searchTerm.toLowerCase() === Purpose.Buy.toLowerCase()) {
			query.OR.push({
				Purpose: Purpose.Buy,
			});
		}
		const rentFrequency = Object.keys(RentFrequency);
		rentFrequency.map((item) => {
			if (searchTerm.toLowerCase() === item.toLowerCase()) {
				query.OR.push({
					RentFrequency: item,
				});
			}
		});
		const completionStatus = Object.keys(CompletionStatus);
		completionStatus.map((item) => {
			if (searchTerm.toLowerCase() === item.toLowerCase()) {
				query.OR.push({
					CompletionStatus: item,
				});
			}
		});
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: query,
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({
				where: query,
			}),
		]);
		if (!Properties) {
			return res.status(404).send("No Properties Were Found!");
		}
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
//Filter Properties

const FilterProperties = async (req, res) => {
	try {
		const filter = req.body;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const query = {
			AND: [
				{
					addressId: {
						in: filter.Addresses,
					},
				},
				{
					Bathrooms: {
						in: filter.Bathrooms,
					},
				},
				{
					Bedrooms: {
						in: filter.Bedrooms,
					},
				},
				{
					categoryId: {
						equals: filter.CategoryID,
					},
				},
				{
					Area: {
						lte: filter.AreaMax,
					},
				},
				{
					Price: {
						gte: filter.PriceMin,
					},
				},
				{
					Price: {
						lte: filter.PriceMax,
					},
				},
				{
					Area: {
						gte: filter.AreaMin,
					},
				},
			],
		};

		if (filter.purpose) {
			if (filter.purpose.toLowerCase() === Purpose.Rent.toLowerCase()) {
				query.AND.push({
					Purpose: Purpose.Rent,
				});
			} else if (filter.purpose.toLowerCase() === Purpose.Buy.toLowerCase()) {
				query.AND.push({
					Purpose: Purpose.Buy,
				});
			}
		}
		if (filter.rentFrequency) {
			const rentFrequency = Object.keys(RentFrequency);
			rentFrequency.map((item) => {
				if (filter.rentFrequency.toLowerCase() === item.toLowerCase()) {
					query.AND.push({
						RentFrequency: item,
					});
				}
			});
		}
		if (filter.completionStatus) {
			const completionStatus = Object.keys(CompletionStatus);
			completionStatus.map((item) => {
				if (filter.completionStatus.toLowerCase() === item.toLowerCase()) {
					query.AND.push({
						CompletionStatus: item,
					});
				}
			});
		}
		const [Properties, count] = await prisma.$transaction([
			prisma.property.findMany({
				where: query,
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Images: true,
					Aminities: {
						include: {
							Image: true,
							Aminities_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			}),
			prisma.property.count({
				where: query,
			}),
		]);
		res.status(200).json({
			count,
			Properties,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

//Update Property
const UpdateProperty = async (req, res) => {
	try {
		const id = req.params.id;
		const updates = Object.keys(req.body);
		const images = req.files;
		const Selected = { id: true };
		updates.forEach((item) => {
			if (
				item !== "AddressID" &&
				item !== "DeveloperID" &&
				item !== "CategoryID"
			)
				Selected[item] = true;
		});
		const data = await prisma.property.findUnique({
			where: { id: id },
			select: Selected,
		});
		if (!data) {
			return res.status(404).send("Property was not Found!");
		}
		if (images) {
			data.Images = [];
		}
		updates.forEach((update) => (data[update] = req.body[update]));
		data.Price = parseFloat(data?.Price);
		data.Bedrooms = parseInt(data?.Bedrooms);
		data.BalconySize = parseFloat(data?.BalconySize);
		data.RentMin = parseFloat(data?.RentMin);
		data.RentMax = parseFloat(data?.RentMax);
		data.Longitude = parseFloat(data?.Longitude);
		data.Latitude = parseFloat(data?.Latitude);
		data.Area = parseFloat(data?.Area);
		if (images) {
			images.map(async (image) => {
				data.Images.push({
					URL: image.path,
					Alt: image?.originalname,
					Size: image.size,
					Type: image.mimetype,
					user: undefined,
				});
			});
		}
		if (updates.includes("ActiveStatus")) {
			if (req.body.ActiveStatus.toLowerCase() === "false") {
				data.ActiveStatus = false;
			} else {
				data.ActiveStatus = true;
			}
		}
		if (data.Bacloney) {
			if (req.body.Bacloney.toLowerCase() === "false") {
				data.Bacloney = false;
			} else {
				data.Bacloney = true;
			}
		}
		let amenities = [];
		if (data.Aminities) {
			console.log("object");
			data.Aminities.forEach((item) =>
				amenities.push({
					id: item,
				}),
			);
		}
		const result = await prisma.$transaction(async (prisma) => {
			if (data.Property_Translation !== undefined) {
				data.Property_Translation.map(async (item) => {
					{
						await prisma.property_Translation.updateMany({
							where: {
								AND: [{ languagesID: item.languagesID }, { propertyID: id }],
							},
							data: {
								Name: item.Name,
								Description: item.Description,
							},
						});
					}
				});
			}
			const UpdatedProperty = await prisma.property.update({
				where: { id: id },
				data: {
					Price: data.Price || undefined,
					Bedrooms: data.Bedrooms || undefined,
					Bacloney: data.Bacloney || undefined,
					BalconySize: data.BalconySize || undefined,
					RentMin: data.RentMin || undefined,
					RentMax: data.RentMax || undefined,
					Area: data.Area || undefined,
					Handover: data.Handover || undefined,
					FurnishingStatus: data.FurnishingStatus || undefined,
					VacantStatus: data.VacantStatus || undefined,
					Longitude: data.Longitude || undefined,
					Latitude: data.Latitude || undefined,
					ActiveStatus: data?.ActiveStatus || undefined,
					Purpose: data.Purpose || undefined,
					RentFrequency: data.RentFrequency || undefined,
					CompletionStatus: data.CompletionStatus || undefined,
					PermitNumber: data.PermitNumber || undefined,
					DEDNo: data.DEDNo || undefined,
					ReraNo: data.ReraNo || undefined,
					BRNNo: data.BRNNo || undefined,
					Property_Translation: data?.Property_Translation && {
						createMany: {
							data: data.Property_Translation,
						},
					},
					Aminities: data?.Aminities && {
						connect: amenities,
					},
					Developer: data?.DeveloperID && {
						connect: {
							id: data?.DeveloperID,
						},
					},
					Category: data?.CategoryID && {
						connect: {
							id: data?.CategoryID,
						},
					},
					Address: data?.AddressID && {
						connect: {
							id: data?.AddressID,
						},
					},
					Images: {
						createMany: {
							data: data.Images,
						},
					},
				},
				include: {
					Images: true,
					Aminities: true,
					Category: {
						include: {
							Category_Translation: {
								include: {
									Language: true,
								},
							},
							Parent: true,
						},
					},
					Developer: {
						include: {
							Developer_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Address: {
						include: {
							Address_Translation: {
								include: { Language: true },
							},
						},
					},
					Property_Translation: {
						include: {
							Language: true,
						},
					},
				},
			});

			return UpdatedProperty;
		});

		return res.status(200).json({
			Message: "Updated successfully",
			result,
		});
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

//Delete All Images for a Property

const DeletePropertyImages = async (req, res) => {
	try {
		const id = req.params.id;
		const result = await prisma.$transaction(async (prisma) => {
			const Images = await prisma.images.findMany({
				where: {
					propertyId: id,
				},
			});
			if (Images.length > 0) {
				Images.map(async (image) => {
					if (fs.existsSync(image.URL)) {
						fs.unlinkSync(image.URL);
					}
				});
				await prisma.images.deleteMany({
					where: {
						propertyId: id,
					},
				});
			} else {
				return {
					Message: "No Images Were Found for This Property!",
					Images,
				};
			}
			return {
				Message: "Images Deleted Successfully ",
				Images,
			};
		});

		// if (Images.count === 0) {
		// 	return res.status(404).send("No Images were Found!");
		// }
		return res.status(200).send(result);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
const DeleteImageByID = async (req, res) => {
	try {
		const id = req.params.id;
		const result = await prisma.$transaction(async (prisma) => {
			const Image = await prisma.images.findUnique({
				where: {
					id: id,
				},
			});
			if (Image) {
				if (fs.existsSync(Image.URL)) {
					fs.unlinkSync(Image.URL);
				}
				await prisma.images.delete({
					where: {
						id: id,
					},
				});
			} else {
				return {
					Message: "No Image Were Found for This Property!",
					Image,
				};
			}
			return {
				Message: "Image Deleted Successfully ",
				Image,
			};
		});

		// if (Images.count === 0) {
		// 	return res.status(404).send("No Images were Found!");
		// }
		return res.status(200).send(result);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};
// Delete Property
const DeleteProperty = async (req, res) => {
	try {
		const id = req.params.id;
		const Property = await prisma.property.findFirst({
			where: { id: id },
			include: {
				Images: true,
				Aminities: {
					include: {
						Image: true,
						Aminities_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Category: {
					include: {
						Category_Translation: {
							include: {
								Language: true,
							},
						},
						Parent: true,
					},
				},
				Developer: {
					include: {
						Developer_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Address: {
					include: {
						Address_Translation: {
							include: { Language: true },
						},
					},
				},
				Property_Translation: {
					include: {
						Language: true,
					},
				},
			},
		});
		if (!Property) {
			return res.status(404).send("Property Does not Exist!");
		}
		if (Property.Images.length > 0) {
			Property.Images.map(async (image) => {
				if (fs.existsSync(image.URL)) {
					fs.unlinkSync(image.URL);
					await prisma.images.delete({
						where: {
							id: image.id,
						},
					});
				}
			});
		}
		if (Property.Property_Translation.length > 0) {
			await prisma.property_Translation.deleteMany({
				where: {
					propertyID: id,
				},
			});
		}
		await prisma.property.delete({
			where: {
				id: id,
			},
		});
		res.status(200).json({
			"Image Deleted: ": Property.Images,
			Property,
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
	CreateProperty,
	GetAllProperties,
	PropertySearch,
	GetPropertyByID,
	GetPropertiesByCategoryID,
	GetActivePropertiesByCategoryID,
	GetPropertiesByAddressID,
	GetActivePropertiesByAddressID,
	GetActivePropertiesByDeveloperID,
	GetPropertiesByDeveloperID,
	GetAllActiveProperties,
	FilterProperties,
	UpdateProperty,
	DeletePropertyImages,
	DeleteImageByID,
	DeleteProperty,
};
