const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { Prisma } = require("@prisma/client");
const { HandleError } = require("../middlewares/ErrorHandler");
require("dotenv").config;

const CreateRole = async (req, res) => {
	try {
		const { Name, ActiveStatus } = req.body;
		if (!Name) {
			return res.status(400).send("Role Name is Missing!!");
		}

		const result = await prisma.$transaction(async (prisma) => {
			const Role = await prisma.role.create({
				data: {
					Name,
					ActiveStatus,
				},
			});
			const Resources = await prisma.resources.findMany({
				select: { ID: true },
			});
			let data = [];
			Resources.forEach(async (resource) => {
				data.push({
					Create: false,
					Read: false,
					Update: false,
					Delete: false,
					roleID: Role.ID,
					resourcesID: resource.ID,
				});
			});
			console.log("Data: ", data);
			const RoleResources = await prisma.role_Resources.createMany({
				data,
			});
			return { Role, RoleResources };
		});

		if (result) {
			return res.status(201).send(result);
		} else {
			return res.status(409).send("Details are not correct");
		}
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetAllRoles = async (req, res) => {
	try {
		const Roles = await prisma.role.findMany({
			include: { Users: true, Role_Resources: { include: { resource: true } } },
		});
		if (!Roles) {
			return res.status(404).send("No Roles Were Found!");
		}
		res.status(200).send(Roles);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetAllActiveRoles = async (req, res) => {
	try {
		const Roles = await prisma.role.findMany({
			where: { ActiveStatus: true },
			include: { Users: true, Role_Resources: { include: { resource: true } } },
		});
		if (!Roles) {
			return res.status(404).send("No Roles Were Found!");
		}
		res.status(200).send(Roles);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const GetRoleByID = async (req, res) => {
	try {
		const id = req.params.id;
		const Roles = await prisma.role.findUnique({
			where: { ID: id },
			include: { Role_Resources: { include: { resource: true } } },
		});
		if (!Roles) {
			return res.status(404).send("No Roles Were Found!");
		}
		res.status(200).send(Roles);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const UpdateRole = async (req, res) => {
	try {
		const id = req.params.id;
		const updates = Object.keys(req.body);
		const Role = await prisma.role.findUnique({
			where: { ID: id },
		});
		if (!Role) {
			return res.status(404).send("No Roles Were Found!");
		}
		updates.forEach((update) => (Role[update] = req.body[update]));
		await prisma.role.update({
			where: { ID: id },
			data: Role,
		});
		res.status(200).send(Role);
	} catch (error) {
		return res.status(500).send(error.message);
	}
};

const DeleteRole = async (req, res) => {
	try {
		const id = req.params.id;

		const result = await prisma.$transaction(async (prisma) => {
			const Role = await prisma.role.findUnique({
				where: { ID: id },
				include: {
					Role_Resources: true,
					Users: true,
				},
			});
			if (Role.Users.length !== 0) {
				throw new Error(
					"Role cannot be deleted, There are users associated with it",
				);
			}
			if (Role.Role_Resources.length >= 0) {
				await prisma.role_Resources.deleteMany({
					where: { roleID: Role.ID },
				});
			}
			const DeletedRole = await prisma.role.delete({
				where: { ID: id },
			});
			return { DeletedRole };
		});
		res.status(200).send(result);
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
	CreateRole,
	GetAllRoles,
	GetRoleByID,
	GetAllActiveRoles,
	UpdateRole,
	DeleteRole,
};
