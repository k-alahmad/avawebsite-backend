const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
	log: ["query", "info", "warn", "error"],
});
// use `prisma` in your application to read and write data in your DB
module.exports = prisma;
