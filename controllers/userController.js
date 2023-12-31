const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { Prisma } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config;

//Create New User
const Register = async (req, res) => {
	try {
		let {
			Name,
			Email,
			Password,
			PhoneNo,
			Title,
			ActiveStatus,
			Gender,
			DOB,
			roleID,
			addressId,
			teamID,
		} = req.body;
		const image = req.file;
		if (!Name || !Email || !Password) {
			return res.status(400).send("Required Field Missing!!");
		}
		if (ActiveStatus) {
			if (req.body.ActiveStatus.toLowerCase() === "false") {
				ActiveStatus = false;
			} else {
				ActiveStatus = true;
			}
		}
		const user = await prisma.users.create({
			data: {
				Name,
				Email,
				Password: await bcrypt.hash(Password, 10),
				ActiveStatus,
				Gender: Gender || undefined,
				DOB,
				Title,
				PhoneNo,
				Role: roleID && {
					connect: {
						id: roleID,
					},
				},
				Address: addressId && {
					connect: {
						id: addressId,
					},
				},
				Team: teamID && {
					connect: {
						id: teamID,
					},
				},
				Image: image
					? {
							create: {
								URL: image.path,
								Alt: image?.originalname,
								Size: image.size,
								Type: image.mimetype,
							},
					  }
					: undefined,
			},
			include: {
				Role: true,
				Image: true,
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
		});
		if (user) {
			return res.status(201).send(user);
		} else {
			return res.status(409).send("Details are not correct");
		}
	} catch (error) {
		res.status(500).send(error.message);
	}
};
function exclude(user, keys) {
	return Object.fromEntries(
		Object.entries(user).filter(([key]) => !keys.includes(key)),
	);
}
//Get All Users////Done
const GetAllUsers = async (req, res) => {
	try {
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Users, count] = await prisma.$transaction([
			prisma.users.findMany({
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Role: true,
					Team: true,
					Image: true,
					Address: {
						include: {
							Address_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Articles: {
						include: {
							Articles_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Jobs: true,
				},
			}),
			prisma.users.count(),
		]);

		if (!Users) {
			return res.status(404).send("No users were found!");
		}
		Users.map((user) => {
			delete user.Password;
		});
		res.status(200).json({
			count,
			Users,
		});
	} catch (error) {
		res.status(500).send(error.message);
	}
};

const GetAllActiveUsers = async (req, res) => {
	try {
		const query = {
			where: {
				ActiveStatus: true,
			},
		};
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Users, count] = await prisma.$transaction([
			prisma.users.findMany({
				where: { ActiveStatus: true },
				skip: offset || undefined,
				take: limit || undefined,
				include: {
					Role: true,
					Team: true,
					Image: true,
					Address: {
						include: {
							Address_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Articles: {
						include: {
							Articles_Translation: {
								include: {
									Language: true,
								},
							},
						},
					},
					Jobs: true,
				},
			}),
			prisma.users.count(query),
		]);

		if (!Users) {
			return res.status(404).send("No users were found!");
		}
		Users.map((user) => {
			delete user.Password;
		});
		res.status(200).json({
			count,
			Users,
		});
	} catch (error) {
		res.status(500).send(error.message);
	}
};
const GetUserByID = async (req, res) => {
	try {
		const query = {
			where: {
				id: req.params.id,
			},
			include: {
				Role: true,
				Team: true,
				Image: true,
				Address: {
					include: {
						Address_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Articles: {
					include: {
						Articles_Translation: {
							include: {
								Language: true,
							},
						},
					},
				},
				Jobs: true,
			},
		};
		const user = await prisma.users.findUnique(query);
		delete user.Password;
		if (!user) {
			return res.status(404).send("No users were found!");
		}
		res.status(200).send(user);
	} catch (error) {
		res.status(500).send(error.message);
	}
};

const UpdateUser = async (req, res) => {
	try {
		const id = req.params.id;
		const updates = Object.keys(req.body);
		const image = req.file;
		const Selected = { id: true };

		updates.forEach((item) => {
			// if (item !== "AddressID" && item !== "roleID" && item !== "teamID")
			Selected[item] = true;
		});
		if (image) {
			Selected["Image"] = true;
		}

		const User = await prisma.users.findUnique({
			where: { id: id },
			select: Selected,
		});
		if (!User) {
			return res.status(404).send("User was not Found!");
		}
		updates.forEach((update) => (User[update] = req.body[update]));
		if (image) {
			if (User.Image !== null) {
				if (fs.existsSync(`${User.Image.URL}`)) {
					console.log(`${User.Image.URL}`);
					fs.unlinkSync(`${User.Image.URL}`);
				}
				await prisma.images.delete({ where: { id: User.Image.id } });
			}
			User.Image = {
				create: {
					URL: image.path,
					Alt: image?.originalname,
					Size: image.size,
					Type: image.mimetype,
					teamID: undefined,
				},
			};
		}
		if (updates.includes("Password")) {
			User.Password = await bcrypt.hash(User.Password, 10);
		}
		if (updates.includes("ActiveStatus")) {
			if (req.body.ActiveStatus.toLowerCase() === "false") {
				User.ActiveStatus = false;
			} else {
				User.ActiveStatus = true;
			}
		}
		await prisma.users.update({
			where: { id: id },
			data: User,
		});
		res.status(200).json({
			Message: "Updated successfully",
			User,
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			console.log(error.code);
			if (error.code === "P2025") {
				return res.status(404).send("Record Doesn't Exist!");
			} else if (error.code === "P2021") {
				return res.status(404).send("Table Doesn't Exist!");
			}
		}
		return res.status(500).send(error.message);
	}
};

//Get Users By Team ID

const GetUsersByTeamID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Team, Users, count] = await prisma.$transaction([
			prisma.team.findUnique({ where: { id: id } }),
			prisma.users.findMany({
				where: { teamID: id },
				skip: offset || undefined,
				take: limit || undefined,
				include: { Role: true, Team: true, Image: true },
			}),
			prisma.users.count({ where: { teamID: id } }),
		]);
		if (!Team) {
			return res.status(404).send("Team was not found!");
		}
		Users.map((user) => {
			delete user.Password;
		});
		return res.status(200).json({
			count,
			Users,
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
//Get Users By Role ID

const GetUsersByRoleID = async (req, res) => {
	try {
		const id = req.params.id;
		let { page, limit } = req.query;
		page = parseInt(page) || 1;
		limit = parseInt(limit);
		const offset = (page - 1) * limit;
		const [Role, Users, count] = await prisma.$transaction([
			prisma.role.findUnique({ where: { id: id } }),
			prisma.users.findMany({
				where: { roleID: id },
				skip: offset || undefined,
				take: limit || undefined,
				include: { Role: true, Team: true, Image: true },
			}),
			prisma.users.count({ where: { roleID: id } }),
		]);
		if (!Role) {
			return res.status(404).send("Role was not found!");
		}
		Users.map((user) => {
			delete user.Password;
		});
		return res.status(200).json({
			count,
			Users,
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

//Delete User
const DeleteUser = async (req, res) => {
	try {
		const id = req.params.id;
		const User = await prisma.users.delete({
			where: { id: id },
		});
		res.status(200).send(User);
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
	Register,
	GetAllUsers,
	GetAllActiveUsers,
	GetUsersByTeamID,
	GetUsersByRoleID,
	GetUserByID,
	UpdateUser,
	DeleteUser,
};
