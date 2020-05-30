import express from "express";
const app = express();

app.get("/", (_req, res) => {
	res.status(200);
	res.send("Ok");
});

require("./index");