import express from "express";
const app = express();

app.get("/", (_req, res) => {
	res.status(200);
	res.send("Ok");
});

app.listen(process.env.PORT, () => {
    console.log("App is listening on port " + process.env.PORT);
});

require("./index");