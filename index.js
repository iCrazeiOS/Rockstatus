const fetch = require("node-fetch");
const { exit } = require("process");
const SERVER_URL = "https://support.rockstargames.com/services/status.json?tz=Europe/London";

const services = [
	{"rs_index": 1, "name": "Red Dead Online"},
	{"rs_index": 2, "name": "Grand Theft Auto Online"},
	{"rs_index": 3, "name": "Social Club"},
	{"rs_index": 5, "name": "Rockstar Games Launcher"}
]

const statusToText = {
	1: "UP",
	2: "DOWN",
	3: "LIMITED"
}

fetch(SERVER_URL, {"method": "GET"}).then(res => {
	if (res.status !== 200) {
		console.log("Error fetching server status");
		exit();
	}
	return res.json()
}).then(json => {
	for (let i=0; i < services.length; i++) {
		let serviceInfo = json["statuses"][services[i]["rs_index"]];
		services[i]["status"] = serviceInfo["status"];
		let individualServices = [];
		for (let j=0; j < serviceInfo["services_platforms"].length; j++) {
			let individualService = serviceInfo["services_platforms"][j];
			individualServices.push({"name": individualService["name"], "status": individualService["service_status_id"]});
		}
		services[i]["individualServices"] = individualServices;
	};

	checkStatus(services);
});


function checkStatus(services) {
	let totalServices = 0;
	let totalWorkingServices = 0;
	let servicesWithIssues = {};

	for (let i=0; i < services.length; i++) {
		totalServices += services[i]["individualServices"].length;
		for (let j=0; j < services[i]["individualServices"].length; j++) {
			if (services[i]["individualServices"][j]["status"] === 1) {
				totalWorkingServices++;
			} else {
				if (!servicesWithIssues[services[i]["name"]]) servicesWithIssues[services[i]["name"]] = [];
				let serviceWithIssue = services[i]["individualServices"][j];
				servicesWithIssues[services[i]["name"]].push({"name": serviceWithIssue["name"], "status": serviceWithIssue["status"]});
			}
		}
	}

	if (totalServices === totalWorkingServices) {
		console.log("All services are up!");
	} else {
		console.log(`${totalServices-totalWorkingServices}/${totalServices} services are down`);
		prettyPrintIssues(servicesWithIssues);
	}
}


function prettyPrintIssues(services) {
	for (let service in services) {
		console.log(`${service} issues:`);
		for (let i=0; i < services[service].length; i++) {
			console.log(`${services[service][i]["name"]}: ${statusToText[services[service][i]["status"]]}`);
		}
	}
}
