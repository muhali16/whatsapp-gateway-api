function phoneFormater(phone) {
	let number = phone.replace(/\D/g, "");
	if (phone.startsWith("0")) {
		number = "62" + phone.slice(1) + "@c.us";
	} else if (phone.startsWith("62")) {
		number = phone + "@c.us";
	} else {
		number = phone + "@c.us";
	}
	console.log(number);
	return number;
}

module.exports = phoneFormater;
