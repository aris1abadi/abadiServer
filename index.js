import { Server } from "socket.io";
import { MongoClient } from 'mongodb';
//import fs from "fs/promises"
import { promises as fs } from 'fs';

import Aedes from 'aedes'
import { createServer } from 'net'



//local
let pathGambar = "/home/oem/abadipos/abadipos50/static/public/"
//let pathGambar = "/home/oem/abadipos/abadipos50/build/client/public/"

//lesehanpundong
//let pathGambar = "/home/abadinet/abadipos50/build/client/public/"




const uri = 'mongodb://localhost:27017';
const options = {
	useUnifiedTopology: true,
	useNewUrlParser: true
};

let client;
// @ts-ignore
let clientPromise;

// @ts-ignore
let dataMenu;
// @ts-ignore
let dataPelanggan;
// @ts-ignore
let dataBahan;
let dataKategori
let transaksiJualCountNow = 0;
let transaksiBeliCountNow = 0;
let dta;

let dataTransaksiJualOpen

client = new MongoClient(uri, options);
clientPromise = client.connect();

//-----------MQTT------------------
const port = 2000

const aedes = new Aedes()
const mqttBroker = createServer(aedes.handle)

mqttBroker.listen(port,"0.0.0.0", function () {
	console.log('server started and listening on port ', port)
})

mqttBroker.on('error', function (err) {
	console.log('Server error', err)
	process.exit(1)
})

aedes.on('subscribe', function (subscriptions, client) {
	console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
		'\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
})

aedes.on('unsubscribe', function (subscriptions, client) {
	console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
		'\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id)
})

// fired when a client connects
aedes.on('client', function (client) {
	console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a client disconnects
aedes.on('clientDisconnect', function (client) {
	console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a message is published
aedes.on('publish', async function (packet, client) {
	//console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
	if (packet.topic === "dapur1-resp") {

		//loadTransaksiJualOpen();
		//sendMsg("dapur2_out",dataTransaksiJualOpen);


	}else if(packet.topic === "dapur2-resp"){
		console.log("response dapur2: ",packet.payload.toString());
		dataTransaksiJualOpen.forEach((menu,index) =>{
			if(menu.id === (packet.payload.toString())){
				console.log(menu);
			}
		})
	}else if(packet.topic === "dapur3-resp"){
		
	}

})



function sendMsg(dest, content) {
	const msg = {
		cmd: 'publish',
		topic: dest,
		payload: JSON.stringify(content),
		dup: false,
		qos: 0,
		retain: false
	}
	//console.log("isi pesan: ",dataTransaksiJualOpen)


	aedes.publish(msg, (resp) => {
		console.log("response:", resp)
	})
}

function kirimKeDapur(data) {
	let antrianDapur1 = [];
	let antrianDapur2 = [];
	let antrianDapur3 = [];
	//console.log(data);

	let hariIni = getTanggal(Date.now());
	data.forEach(
		(
			/** @type {{  status: string; waktuOrder: any; }} */ antrian,
			/** @type {any} */ index
		) => {
			if (antrian.status === "open") {
				let wto = getTanggal(antrian.waktuOrder);
				//console.log(wto)
				if (wto === hariIni) {
					let itemDapur1 = {
						id: antrian.id,
						namaPelanggan: antrian.pelanggan.nama,
						jenisOrder: antrian.jenisOrder,
						waktuOrder: antrian.waktuOrder,
						item: [],
					};
					let itemDapur2 = {
						id: antrian.id,
						namaPelanggan: antrian.pelanggan.nama,
						jenisOrder: antrian.jenisOrder,
						waktuOrder: antrian.waktuOrder,
						item: [],
					};
					let itemDapur3 = {
						id: antrian.id,
						namaPelanggan: antrian.pelanggan.nama,
						jenisOrder: antrian.jenisOrder,
						waktuOrder: antrian.waktuOrder,
						item: [],
					};
					let menuDapur1Found = false;
					let menuDapur2Found = false;
					let menuDapur3Found = false;
					antrian.item.itemDetil.forEach((item) => {
						dataMenu.forEach((menu) => {
							if (item.id === menu.id) {
								if (menu.dapur === "1") {
									let menuDapur = {
										nama: item.nama,
										id: item.id,
										jml: item.jml,
										isReady: item.isReady
									};

									itemDapur1.item.push(menuDapur);

									menuDapur1Found = true;
								}

								if (menu.dapur === "2") {
									let menuDapur = {
										nama: item.nama,
										id: item.id,
										jml: item.jml,
										isReady: item.isReady
									};

									itemDapur2.item.push(menuDapur);

									menuDapur2Found = true;
								}

								if (menu.dapur === "3") {
									let menuDapur = {
										nama: item.nama,
										id: item.id,
										jml: item.jml,
										isReady: item.isReady
									};

									itemDapur3.item.push(menuDapur);

									menuDapur3Found = true;
								}

							}
						});
					});
					if (menuDapur1Found) {
						antrianDapur1.push(itemDapur1);
					}

					if (menuDapur2Found) {
						antrianDapur2.push(itemDapur2);
					}

					if (menuDapur3Found) {
						antrianDapur3.push(itemDapur3);
					}
				}
			}
		}
	);
	antrianDapur1 = antrianDapur1;
	antrianDapur2 = antrianDapur2;
	antrianDapur3 = antrianDapur3;
	//console.log(antrianDapur1);

	if(antrianDapur1.length > 0){		
		sendMsg("dapur1-cmd",antrianDapur1);
	}

	if(antrianDapur2.length > 0){
		sendMsg("dapur2-cmd",antrianDapur2);
	}

	if(antrianDapur3.length > 0){
		sendMsg("dapur3-cmd",antrianDapur3);
	}
}


//----------------------------------


const ioServer = new Server({
	cors: {
		//origin: "http://192.168.0.110:3000",
		origin: '*',
		methods: ['GET', 'POST']
	}
});


process.nextTick(function () {
	console.log("Server restart ", timeNow())
	loadMenu();
	loadBahan();
	loadPelanggan();
	loadSuplier();
	loadKategori();
	loadTransaksiJualCount();
	//loadTransaksiJualOpen();
})

ioServer.listen(3300);

ioServer.on("connection", (socket) => {

	//load ketika client konek
	if (typeof dataMenu !== 'undefined' && dataMenu.length > 0) {
		ioServer.emit('myMenu', dataMenu);
	} else {
		loadMenu()
	}
	if (typeof dataBahan !== 'undefined' && dataBahan.length > 0) {
		ioServer.emit('myBahan', dataBahan);
	} else {
		loadBahan()
	}

	if (typeof dataSuplier !== 'undefined' && dataSuplier.length > 0) {
		ioServer.emit('mySuplier', dataSuplier);
	} else {
		loadSuplier()
	}

	if (typeof dataPelanggan !== 'undefined' && dataPelanggan.length > 0) {
		ioServer.emit('myPelanggan', dataPelanggan);
	} else {
		loadPelanggan()
	}

	if (typeof dataKategori !== 'undefined' && dataKategori.length > 0) {
		ioServer.emit('myKategori', dataKategori);
	} else {
		loadKategori()
	}

	if (transaksiBeliCountNow > 0) {
		//ioServer.emit('myTransaksiJualCount', transaksiJualCountNow);
		ioServer.emit('myTransaksiBeliCount', transaksiBeliCountNow);
	} else {
		loadTransaksiJualCount()
	}

	if (transaksiJualCountNow > 0) {
		//ioServer.emit('myTransaksiJualCount', transaksiJualCountNow);
		ioServer.emit('myTransaksiBeliCount', transaksiBeliCountNow);
	} else {
		loadTransaksiJualCount()
	}


	socket.on('fromClient', (msg) => {
		//console.log('ini dari client: ' + msg)
		if (msg === 'getMenu') {
			loadMenu();
		} else if (msg === 'getMenuPesenan') {
			loadMenuPesenan();
		} else if (msg === 'getTransaksiJual') {
			loadTransaksiJual();
		} else if (msg === 'getTransaksiJualOpen') {
			loadTransaksiJualOpen();
		} else if (msg === 'getTransaksiJualCount') {
			loadTransaksiJualCount();
		} else if (msg === 'getBahan') {
			loadBahan();
		} else if (msg === 'getTransaksiBeli') {
			loadTransaksiBeli();
		} else if (msg === 'getTransaksiBeliCount') {
			loadTransaksiBeliCount();
		} else if (msg === 'getSuplier') {
			loadSuplier();
		} else if (msg === 'getPelanggan') {
			loadPelanggan();
		} else if (msg === 'getCloseTransaksiNow') {
			loadCloseTransaksiNow();
		} else if (msg === 'getTransaksiBeliNow') {
			loadTransaksiBeliNow()
		} else if (msg === 'getKategori') {
			loadKategori()
		}
	});

	socket.on('simpanTransaksiJual', (msg) => {
		simpanTransaksiJual(msg);
	});

	socket.on('simpanTransaksiBeli', (msg) => {
		simpanTransaksiBeli(msg);
	});

	//socket.on('simpanTransaksiJualCount', (msg) => {
	//	simpanTransaksiJualCount(msg);
	//});

	//socket.on('simpanTransaksiBeliCount', (msg) => {
	//	simpanTransaksiBeliCount(msg);
	//});

	socket.on('updateTransaksiJual', (msg) => {
		updateTransaksiJual(msg);
	});

	socket.on('closeTransaksiJual', (msg) => {
		closeTransaksiJual(msg);
	});

	socket.on('simpanBahan', (msg) => {
		simpanBahan(msg);
	});

	socket.on('simpanPelanggan', (msg) => {
		simpanPelanggan(msg);
	});

	socket.on('tambahStok', (msg) => {
		tambahStok(msg);
	});

	socket.on('hapusItemLama', (msg) => {
		hapusItemLama(msg);
	});

	socket.on("waQR", (msg) => {
		// @ts-ignore
		qrcode.toDataURL(msg, (err, url) => {
			ioServer.emit('qr', url);
			//socket.emit('message', 'QR Code received, scan please!');
		});
	})

	socket.on("save_image", async (file, callback) => {
		let gambarLok = pathGambar + file.name
		let outResp = "-"
		try {
			const content = file.data0;
			await fs.writeFile(gambarLok, file)
			outResp = "Sukses"

			return outResp
		} catch (err) {
			console.log(err);
			outResp = "Gagal"
			return outResp
		}
	});

	socket.on('menu_upload', (fileData) => {
		//console.log('File received:', fileData);		
		// Here, you can process the received file data as per your requirements.
		//writeFile("/home/abadi/abadipos50/static", fileData.data, (err) => {
		//	callback({ message: err ? "failure" : "success" });
		//});
		if ((fileData.dataMenu.gambar !== 'logo2023.png') || (fileData.dataMenu.gambar !== dataMenu.gambar)) {
			simpanGambar(fileData)
		} else {
			console.log("default gambar")
		}
		//const fileBuffer = Buffer.from(fileData.data, 'base64');
		if (fileData.newMenu === true) {
			//bikin id baru
			let nId = (parseInt(dataMenu[dataMenu.length - 1].id.slice(1, 3))) + 1;
			let newId = "M"
			if (nId < 10) newId += "0"
			newId += String(nId)
			console.log("newId: ", newId)
			fileData.dataMenu.id = newId

			simpanMenu(fileData.dataMenu)
			console.log("simpan menu ", fileData.dataMenu)
		} else {
			updateMenu(fileData.dataMenu)
			console.log("update menu ", fileData.dataMenu)
		}

	})

	socket.on('bahan_upload', (fileData, callback) => {
		//console.log('File received:', fileData);		
		// Here, you can process the received file data as per your requirements.
		//writeFile("/home/abadi/abadipos50/static", fileData.data, (err) => {
		//	callback({ message: err ? "failure" : "success" });
		//});
		if ((fileData.dataBahan.gambar !== 'logo2023.png') || (fileData.dataBahan.gambar !== dataBahan.gambar)) {
			simpanGambar(fileData)
		} else {
			console.log("default gambar")
		}
		//const fileBuffer = Buffer.from(fileData.data, 'base64');
		if (fileData.newBahan) {
			//bikin id baru
			let nId = (parseInt(dataBahan[dataBahan.length - 1].id.slice(1, 3))) + 1;
			let newId = "B"
			if (nId < 10) newId += "0"
			newId += String(nId)
			console.log("newId: ", newId)
			fileData.dataBahan.id = newId

			simpanBahan(fileData.dataBahan)
			console.log("simpan bahan ", fileData.dataBahan)
		} else {
			updateBahan(fileData.dataBahan)
			console.log("update bahan ", fileData.dataBahan)
		}

	})

	socket.on('pelanggan_upload', (fileData, callback) => {
		//console.log('File received:', fileData);		
		// Here, you can process the received file data as per your requirements.
		//writeFile("/home/abadi/abadipos50/static", fileData.data, (err) => {
		//	callback({ message: err ? "failure" : "success" });
		//});
		if ((fileData.dataPelanggan.gambar !== 'logo2023.png') || (fileData.dataPelanggan.gambar !== dataPelanggan.gambar)) {
			simpanGambar(fileData)
		} else {
			console.log("default gambar")
		}
		//const fileBuffer = Buffer.from(fileData.data, 'base64');
		if (fileData.newPelanggan) {
			//bikin id baru
			let newId = "P" + fileData.dataPelanggan.telp
			fileData.dataPelanggan.id = newId

			simpanPelanggan(fileData.dataPelanggan)
		} else {
			updatePelanggan(fileData.dataPelanggan)
		}

	})

	socket.on('suplier_upload', (fileData, callback) => {
		//console.log('File received:', fileData);		
		// Here, you can process the received file data as per your requirements.
		//writeFile("/home/abadi/abadipos50/static", fileData.data, (err) => {
		//	callback({ message: err ? "failure" : "success" });
		//});
		if ((fileData.dataSuplier.gambar !== 'logo2023.png') || (fileData.dataSuplier.gambar !== dataSuplier.gambar)) {
			simpanGambar(fileData)
		} else {
			console.log("default gambar")
		}
		//const fileBuffer = Buffer.from(fileData.data, 'base64');
		if (fileData.newSuplier) {
			//bikin id baru
			let newId = "S" + fileData.dataSuplier.telp
			fileData.dataSuplier.id = newId

			simpanSuplier(fileData.dataSuplier)
		} else {
			updateSuplier(fileData.dataSuplier)
		}

	})

	socket.on("antrianChange", (msg) => {
		//console.log(msg)
		updateItemReady(msg);
	})


});

function timeNow() {
	const today = new Date(Date.now());
	let tm = today.toLocaleDateString('id-ID', { "timeZone": "Asia/jakarta" }); // "14/6/2020 15:57:36" 
	tm += " "
	tm += today.toLocaleTimeString('id-ID', { "timeZone": "Asia/jakarta" }); // ""
	return tm
}



async function simpanGambar(file) {
	//console.log("simpan gambar ", file.name)
	//path.resolve('/home/abadi/abadipos50/static',file.name)
	//const dest = '/home/abadinet/abadipos50/static/' + file.name

	let gambarLok = pathGambar + file.name
	//let outResp = "-"
	try {
		const content = file.data0;
		await fs.writeFile(gambarLok, content)
		//outResp = "Sukses"
		ioServer.emit("save_Status", "sukses")
		//return outResp
	} catch (err) {
		console.log(err);
		//outResp = "Gagal"
		ioServer.emit("save_Status", "gagal")
		//return outResp
	}
}


function getTanggal(tm) {
	const today = new Date(tm);
	return today.toLocaleDateString('id-ID', { "timeZone": "Asia/jakarta" }); // "14/6/2020"
}

async function loadMenu() {
	try {
		// @ts-ignore

		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataMenu').find().toArray();
		if (dta) {
			dataMenu = dta;
			//console.log("load_dataMenu",dataMenu)
			ioServer.emit('myMenu', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}
async function loadKategori() {
	try {
		// @ts-ignore

		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataKategori').find().toArray();
		if (dta) {
			dataKategori = dta;
			//console.log("load_dataMenu",dataMenu)
			ioServer.emit('myKategori', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}
async function loadBahan() {
	try {
		// @ts-ignore

		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataBahan').find().toArray();

		if (dta) {
			dataBahan = dta
			ioServer.emit('myBahan', dta);
		}


		//
	} catch (err) {
		console.log(err);
	}
}

async function loadSuplier() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataSuplier').find().toArray();
		if (dta) {
			ioServer.emit('mySuplier', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}

async function loadPelanggan() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataPelanggan').find().toArray();
		if (dta) {
			dataPelanggan = dta;
			ioServer.emit('myPelanggan', dta);
		}

		//
	} catch (err) {
		console.log(err);
	}
}

async function loadMenuPesenan() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('dataMenuPesenan').find().toArray();
		if (dta) {
			ioServer.emit('myMenuPesenan', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJual() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiJual').find({ status: 'open' }).toArray();
		if (dta) {
			ioServer.emit('myTransaksiJual', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJualOpen() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		const dataNew = await db.collection('transaksiJual').find({ status: 'open' }).toArray();
		//console.log("transaksi open:",dataNew);
		if (dataNew) {
			ioServer.emit('myTransaksiJualOpen', dataNew);
			dataTransaksiJualOpen = dataNew;
			kirimKeDapur(dataNew);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiBeli() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiBeli').find({ status: 'open' }).toArray();
		if (dta) {
			ioServer.emit('myTransaksiBeli', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

function getTimeNow() {
	const d = new Date();
	const text = d.toLocaleDateString('id-ID', { "timeZone": "Asia/jakarta" })
	const h = new Date(text)
	return h.getTime()
}


async function loadCloseTransaksiNow() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		const hariIni = getTanggal(Date.now())
		const timeNow = getTimeNow()
		//console.log("tanggal sekarang" + tanggal)
		const dataNow = await db
			.collection('transaksiJual')
			.find({ waktuOrder: { $gt: timeNow }, status: "close" })
			.toArray();
		if (dataNow) {
			//sortir close order
			//let hariIni = getTanggal(Date.now())
			// @ts-ignore
			let dataHariIni = []
			// @ts-ignore
			dataNow.forEach((dt) => {
				let wto = getTanggal(dt.waktuOrder)
				if (hariIni === wto) {
					dataHariIni.push(dt)
				}
			})
			// @ts-ignore
			ioServer.emit('myCloseTransaksiNow', dataHariIni);
			//console.log(dataNow)
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiJualCount() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiCount').find().toArray();
		const timeElapsed = Date.now();
		const today = new Date(timeElapsed);
		const tc = today.toLocaleDateString('id-ID'); // "14/6/2020"
		//console.log(dta[0])
		//console.log("timedb",dta[0].timeCode)
		//console.log("timeNow" ,tc)
		if (dta) {
			//console.log(dta.timeCode)			

			if (tc !== dta[0].timeCode) {
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { transaksiBeliCount: 0 } });
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { transaksiJualCount: 0 } });
				await db
					.collection('transaksiCount')
					.updateOne({ dayCount: "base" }, { $set: { timeCode: tc } });
				dta[0].transaksiJualCount = 0;
				dta[0].transaksiBeliCount = 0;
				//console.log('reset transaksi count ' + tc);
			}

			transaksiJualCountNow = dta[0].transaksiJualCount + 1
			transaksiBeliCountNow = dta[0].transaksiBeliCount + 1
			//wa_order.id = bikinIdTransaksiWa();
			ioServer.emit('myTransaksiJualCount', transaksiJualCountNow);
			ioServer.emit('myTransaksiBeliCount', transaksiBeliCountNow);
			//console.log("transaksiJualCount now: ", transaksiJualCountNow)
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiBeliCount() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiCount').findOne({ dayCount: 'base' });
		//console.log(dta)
		if (dta) {
			ioServer.emit('myTransaksiBeliCount', dta.transaksiBeliCount + 1);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanTransaksiJual(data) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('transaksiJual').insertOne(data);
		//update stok
		//console.log("Simpan transaksi jual ", JSON.stringify(data))
		let newStok = 0
		let newStokSama = 0
		let st = {
			id: '',
			stokId: "",
			newStok: 0
		}

		// @ts-ignore
		data.item.itemDetil.forEach((itemDetil) => {
			// @ts-ignore
			newStok = 0
			dataMenu.forEach((menu, index) => {
				if (menu.stokId !== '-') {
					if (menu.stokId === itemDetil.stokId) {
						st.id = menu.id
						st.stokId = menu.stokId
						st.newStok = (menu.stok - itemDetil.jml)
						dataMenu[index].stok -= itemDetil.jml
						console.log("updateStok: " + st.id + " newStok:" + st.newStok)
						updateStok(st)
					}
				}
			})


		})


		//loadStok()
		//update menu & stok
		loadNewStok()

		//loadTransaksiJual();
		simpanTransaksiJualCount(transaksiJualCountNow)

		loadTransaksiJualOpen()
		////
	} catch (err) {
		console.log(err);
	}
}
async function loadNewStok() {
	// @ts-ignore
	const client = await clientPromise;
	const db = client.db('abadipos');

	dta = await db.collection('dataMenu').find().toArray();
	if (dta) {
		dataMenu = dta;
		//console.log("load_dataMenu",dataMenu)
		ioServer.emit('myMenu', dta);
	}
}

async function simpanMenu(newData) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('dataMenu').insertOne(newData);

		dataMenu = []
		loadMenu()

	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanHutang(newData) {
	let newHutang = {
		idTransaksi: newData.id,
		suplier: newData.suplier,
		waktu: newData.waktuBeli,
		totalTagihan: newData.totalTagihan,
		status: "open",
		user: newData.user,
		Pembayaran: []
	}

	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('transaksiHutang').insertOne(newHutang);
	} catch (err) {
		console.log(err);
	}


}

// @ts-ignore
async function updateStokBahan(newData) {
	// @ts-ignore
	newData.item.forEach((item) => {
		// @ts-ignore
		dataMenu.forEach((menu, index) => {
			if (item.stokId === menu.stokId) {

				let st = {
					id: menu.id,
					stokId: menu.stokId,
					newStok: (menu.stok + (item.jml * item.konversi))
				}
				dataMenu[index].stok += (item.jml * item.konversi)
				//console.log("updateStok: " + st.id + " newStok:" + st.newStok)
				updateStok(st)


			}
		})
	})
	loadNewStok()
}

// @ts-ignore
async function simpanTransaksiBeli(data) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('transaksiBeli').insertOne(data);
		//console.log(JSON.stringify(data));
		simpanHutang(data)
		//update stok bahan
		updateStokBahan(data)
		//loadTransaksiBeli();
		loadNewStok()

		simpanTransaksiBeliCount(transaksiBeliCountNow)

		////
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function updateTransaksiJual(data) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('transaksiJual').updateOne(
			{ id: data.id },
			{
				$set: {

					pelanggan: data.pelanggan,
					jenisOrder: data.jenisOrder,
					totalTagihan: data.totalTagihan,
					totalBayar: data.totalBayar,
					item: data.item
				}
			}
		);
		//update stok disini

		loadTransaksiJualOpen();
		////
	} catch (err) {
		console.log(err);
	}
}

async function updateItemReady(newData) {
	//load data item
	try {
		const client = await clientPromise;
		const db = client.db('abadipos');

		dta = await db.collection('transaksiJual').find({ id: newData.id }).toArray();
		//console.log(dta)

		newData.item.forEach((item) => {
			dta[0].item.itemDetil.forEach((dtaItem, index) => {
				if (dtaItem.id === item.id) {
					dta[0].item.itemDetil[index].isReady = item.isReady
				}
			})
		})
		//console.log("tes selesai")

		const tes = await db.collection('transaksiJual').updateOne(
			{ id: newData.id },
			{
				$set: {
					item: dta[0].item
				}
			}
		)

		//update status  disini
		ioServer.emit("UpdateItemChange", newData)


	} catch (err) {
		console.log(err);
	}

	//try {
	// @ts-ignore
	//const client = await clientPromise;
	//const db = client.db('abadipos');

	// @ts-ignore
	//const tes = await db.collection('transaksiJual').updateOne(
	//	{ id: newData.id },
	//	{
	//		$set: {					
	//			item: data.item
	//		}
	//	}
	//);
	//update status  disini
	///	ioServer.emit("UpdateItemChange", newData)
	////
	//} catch (err) {
	//	console.log(err);
	//}
}

// @ts-ignore
async function simpanTransaksiJualCount(count) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db
			.collection('transaksiCount')
			.updateOne({ dayCount: 'base' }, { $set: { transaksiJualCount: count } });
		//console.log('transaksi jual count: ' + count);
		loadTransaksiJualCount();
		//
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanTransaksiBeliCount(count) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db
			.collection('transaksiCount')
			.updateOne({ dayCount: 'base' }, { $set: { transaksiBeliCount: count } });
		//console.log('transaksi Beli count: ' + count);
		loadTransaksiBeliCount();
		////
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanPelanggan(dataPlg) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('dataPelanggan').insertOne(dataPlg);
		loadPelanggan();
		////
	} catch (err) {
		console.log(err);
	}
}

async function updatePelanggan(newPelanggan) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		// @ts-ignore
		const tes = await db.collection('dataPelanggan').updateOne(
			{ id: newPelanggan.id },
			{
				$set: {

					nama: newPelanggan.nama,
					telp: newPelanggan.telp,
					alamat: newPelanggan.alamat,
					map: newPelanggan.map,
					gambar: newPelanggan.gambar
				}
			}
		);
		console.log("simpan pelanggan ", newPelanggan)
		//update stok disini
		dataPelanggan = []
		loadPelanggan();
		////
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanSuplier(dataSp) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('dataSuplier').insertOne(dataSp);
		loadSuplier();
		////
	} catch (err) {
		console.log(err);
	}
}

async function updateSuplier(newSuplier) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		// @ts-ignore
		const tes = await db.collection('dataSuplier').updateOne(
			{ id: newSuplier.id },
			{
				$set: {

					nama: newSuplier.nama,
					telp: newSuplier.telp,
					alamat: newSuplier.alamat,
					map: newSuplier.map,
					gambar: newSuplier.gambar
				}
			}
		);
		console.log("simpan Suplier ", newSuplier)
		//update stok disini
		dataSuplier = []
		loadSuplier();
		////
	} catch (err) {
		console.log(err);
	}
}
// @ts-ignore
async function closeTransaksiJual(data) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		// @ts-ignore
		const tes = await db.collection('transaksiJual').updateOne(
			{ id: data.id },
			{
				$set: {
					pelanggan: data.pelanggan,
					jenisOrder: data.jenisOrder,
					waktuKirim: data.waktuKirim,
					status: 'close',
					totalTagihan: data.totalTagihan,
					totalBayar: data.totalBayar,
					item: data.item
				}
			}
		);
		console.log('close transaksi ID: ', data.id);
		loadTransaksiJualOpen();
		////
	} catch (err) {
		console.log(err);
	}
}
// @ts-ignore
async function tambahStok(newStok) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		const menu = await db.collection('dataMenu').find().toArray();
		//console.log(newData)

		// @ts-ignore
		let jml = 0;
		// @ts-ignore
		let stok_id = [];
		// @ts-ignore
		newStok.forEach((item) => {
			// @ts-ignore
			menu.forEach((mn) => {
				if (mn.id === item.id) {
					db.collection('dataMenu').updateOne({ id: item.id }, { $set: { stok: item.jml } });
					//console.log('update stok: ' + item.nama)
				}

				//cek resepId
			});
		});
		loadMenu();
		//
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function hapusItemLama(id) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		// @ts-ignore
		let itm = [];
		//console.log('hapus item ' + id);
		// @ts-ignore
		const tes = await db
			.collection('dataTransaksiJual')
			// @ts-ignore
			.updateOne({ _id: id }, { $set: { item: itm, totalTagihan: 0 } });
	} catch (err) {
		console.log(err);
	}
}


// @ts-ignore
async function updateStok(newData) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		// @ts-ignore
		const tes = await db
			.collection('dataMenu')
			.updateMany({ stokId: newData.stokId }, { $set: { stok: newData.newStok } });
		//
	} catch (err) {
		console.log(err);
	}



}

/*
waId: "-",
		nama: "-",
		harga: 0,
		hargaGojeg: 0,
		stok: 0,
		stokId: "-",
		id: "-",
		kategori: "-",
		gambar: "-"


*/

async function updateMenu(newData) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('dataMenu').updateOne(
			{ id: newData.id },
			{
				$set: {

					nama: newData.nama,
					waId: newData.waId,
					harga: newData.harga,
					hargaGojeg: newData.hargaGojeg,
					stokId: newData.stokId,
					kategori: newData.kategori,
					gambar: newData.gambar,
					dapur: newData.dapur

				}
			}
		);
		//update stok disini
		dataMenu = []
		loadMenu();
		////
	} catch (err) {
		console.log(err);
	}
}

async function updateBahan(newData) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		// @ts-ignore
		const tes = await db.collection('dataBahan').updateOne(
			{ id: newData.id },
			{
				$set: {

					nama: newData.nama,
					harga: newData.harga,
					stokId: newData.stokId,
					konversi: newData.konversi,
					satuanBeli: newData.satuanBeli,
					satuanPakai: newData.satuanPakai,
					kategori: newData.kategori,
					suplier: newData.suplier,
					kategori: newData.kategori,
					gambar: newData.gambar
				}
			}
		);
		//update stok disini
		dataBahan = []
		loadBahan();
		////
	} catch (err) {
		console.log(err);
	}
}

// @ts-ignore
async function simpanBahan(newData) {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');
		//const collection = db.collection('dataTransaksijual')
		// @ts-ignore
		const tes = await db.collection('dataBahan').insertOne(newData);
		//loadBahan();
		dta = await db.collection('dataBahan').find().toArray();

		if (dta) {
			dataBahan = dta
			ioServer.emit('myBahan', dta);
		}
		//
	} catch (err) {
		console.log(err);
	}
}

async function loadTransaksiBeliNow() {
	try {
		// @ts-ignore
		const client = await clientPromise;
		const db = client.db('abadipos');

		const hariIni = getTanggal(Date.now())
		const timeNow = getTimeNow()
		//console.log("tanggal sekarang" + tanggal)
		const dataNow = await db
			.collection('transaksiBeli')
			.find({ waktuBeli: { $gt: timeNow } })
			.toArray();
		if (dataNow) {
			//sortir close order
			//let hariIni = getTanggal(Date.now())
			// @ts-ignore
			let dataHariIni = []
			// @ts-ignore
			dataNow.forEach((dt) => {
				let wto = getTanggal(dt.waktuBeli)
				if (hariIni === wto) {
					dataHariIni.push(dt)
				}
			})
			// @ts-ignore
			ioServer.emit('myTransaksiBeliNow', dataHariIni);
			//console.log(dataNow)
		}
		//
	} catch (err) {
		console.log(err);
	}
}


