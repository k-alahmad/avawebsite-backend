const express = require("express");

const { CheckAllowedUpdates } = require("../../middlewares/AllowedUpdates");

const { CheckImage } = require("../../middlewares/imageAuth");
const VerifyRole = require("../../middlewares/verifyRole");
const verifyJWT = require("../../middlewares/verifyJWT");
const {
	GetAllAddresses,
	CreateAddress,
	GetAddressByID,
	GetAddressByParentID,
	GetAllActiveAddresses,
	UpdateAddress,
	DeleteAddress,
} = require("../../controllers/addressController");

const addressRouter = express.Router();

addressRouter.post(
	"/address",
	verifyJWT,
	VerifyRole,
	CheckImage,
	CreateAddress,
);
addressRouter.get("/address", verifyJWT, VerifyRole, GetAllAddresses);
addressRouter.get("/address/:id", GetAddressByID);
// addressRouter.get("/address/user/:id", GetAddressByParentID);
addressRouter.get("/address-active", GetAllActiveAddresses);
addressRouter.put(
	"/address/:id",
	verifyJWT,
	VerifyRole,
	CheckAllowedUpdates("address"),
	CheckImage,
	UpdateAddress,
);
addressRouter.delete("/address/:id", verifyJWT, VerifyRole, DeleteAddress);

module.exports = addressRouter;
