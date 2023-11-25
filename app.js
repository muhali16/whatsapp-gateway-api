const Express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const qrcd = require("qrcode");
const socketIo = require("socket.io");
const http = require("http");
const phoneFormater = require("./helpers/phoneFormatter");

// instance whatsapp web js
const client = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: {
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--single-process", // <- this one doesn't works in Windows
			"--disable-gpu",
		],
	},
});
client.initialize();

// instance app express
const app = new Express();
const PORT = 9000;
const server = http.createServer(app);
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.sendFile("index.html", { root: __dirname + "/public" });
});
app.post("/send-message", async (req, res) => {
	let phone = req.body.phone;
	//console.log("phone:", phone);
	//console.log(req);
	let message = req.body.message;
	//console.log(phone);
	try {
		let user = await client.isRegisteredUser(phone);
		//let user = phone;
		if (user) {
			client.sendMessage(phone, message);
			res.status(200).json({
				status: "Berhasil mengirim pesan ke tujuan",
				code: 200,
				data: {
					phone: phone,
				},
			});
		}
	} catch (error) {
		res.status(500).json({
			status: "Error mengirim pesan ke tujuan",
			error: error.message,
		});
		console.log(error.message);
	}
});

// instance socket io
const io = socketIo(server);

io.on("connection", (socket) => {
	socket.emit("message", "Connecting...");

	client.on("qr", (qr) => {
		console.log("QR: ", qr);
		qrcd.toDataURL(qr, (err, url) => {
			socket.emit("qr", url);
			socket.emit("message", "QR code ready, scan the QR!");
		});
	});

	client.on("authenticated", () => {
		console.log("Authtenticated");
		socket.emit("auth", "Authenticated");
		socket.emit("message", "Authenticated");
	});
	client.on("ready", () => {
		console.log("Whatsapp is ready!");
		socket.emit("ready", "Whatsapp is ready!");
		socket.emit("message", "Whatsapp is ready!");
	});

	client.on("disconnected", () => {
		console.log("Client disconnected");
		socket.emit("message", "Whatsapp disconnected");
	});
});

server.listen(PORT, () => {
	console.log("Server run on localhost:" + PORT);
});
