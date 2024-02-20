const allowedUpdatesList = [
	{ name: "role", value: ["Name", "ActiveStatus"] },
	{
		name: "users",
		value: [
			"Name",
			"Email",
			"Gender",
			"Password",
			"PhoneNo",
			"ActiveStatus",
			"roleID",
			"teamID",
			"Title",
			"addressId",
			"DOB",
		],
	},
	{ name: "resources", value: ["Name", "Description", "ActiveStatus"] },
	{ name: "teams", value: ["Title", "Description", "ActiveStatus", "ViewTag"] },
	{ name: "language", value: ["Name", "Code", "Direction"] },
	{ name: "role-resource", value: ["Create", "Update", "Delete", "Read"] },
	{
		name: "article",
		value: [
			"MinRead",
			"ActiveStatus",
			"Image",
			"AuthorID",
			"Title",
			"Description",
			"Caption",
			"Articles_Translation",
		],
	},
	{
		name: "address",
		value: [
			"Longitude",
			"Latitude",
			"Address",
			"ActiveStatus",
			"Image",
			"Name",
			"Address_Translation",
		],
	},
	{
		name: "unit",
		value: [
			"conversionRate",
			"ActiveStatus",
			"Name",
			"Image",
			"Unit_Translation",
		],
	},
	{
		name: "currency",
		value: [
			"conversionRate",
			"ActiveStatus",
			"Name",
			"Image",
			"Currency_Translation",
		],
	},
	{
		name: "developer",
		value: ["ViewTag", "ActiveStatus", "Name", "Developer_Translation"],
	},
	,
	{
		name: "category",
		value: [
			"ParentID",
			"ActiveStatus",
			"Name",
			"Description",
			"Category_Translation",
		],
	},
	{
		name: "announcement",
		value: [
			"ParentID",
			"ActiveStatus",
			"StartDate",
			"EndDate",
			"Link",
			"Rank",
			"Type",
			"Title",
			"Description",
			"ButtonName",
			"Category_Translation",
		],
	},
	{
		name: "aminities",
		value: ["Name", "Description", "Image", "Aminities_Translation"],
	},
	{
		name: "property",
		value: [
			"Price",
			"ActiveStatus",
			"Bedrooms",
			"propertyUnits",
			"Bacloney",
			"BalconySize",
			"RentMin",
			"RentMax",
			"Handover",
			"FurnishingStatus",
			"VacantStatus",
			"Longitude",
			"Latitude",
			"Purpose",
			"Area",
			"RentFrequency",
			"CompletionStatus",
			"PermitNumber",
			"DEDNo",
			"ReraNo",
			"BRNNo",
			"DeveloperID",
			"Aminities",
			"CategoryID",
			"AddressID",
			"properyUnits",
			"Images",
			"Property_Translation",
			"CurrentImages",
		],
	},
	{
		name: "aminities",
		value: ["Name", "Description", "Image", "Aminities_Translation"],
	},
	{
		name: "meta-data",
		value: ["Name", "Content", "PropertyID", "ArticleID"],
	},
	{
		name: "list-with-us",
		value: [
			"Title",
			"Bedrooms",
			"Bacloney",
			"BalconySize",
			"Area",
			"Price",
			"Type",
			"Images",
			"Purpose",
			"Owner",
			"FullName",
			"Email",
			"IPAddress",
			"PhoneNo",
			"Gender",
			"ListWithUs_Translation",
		],
	},
	{
		name: "job",
		value: [
			"Location",
			"Type",
			"WeekHours",
			"Expired",
			"ActiveStatus",
			"Author",
			"AuthorID",
			"Jobs_Translation",
			"Title",
			"Description",
		],
	},
	,
];

module.exports = {
	allowedUpdatesList,
};
