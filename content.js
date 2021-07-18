let cToken;
const infoTextId = "fbddl-info";
const infoTextNumberId = "fbddl-infotext-num";
const progressBarId = "fbddl-progress";
const infoContainerId ="fbddl-container";

const buttonClass = "fbddl-button";
const rowClass = "fbddl-row";
const buttonContentClass = "fbddl-button-content";
const contentId = "fbddl";
const gatherButtonId = "fbddl-gather-button";
const gatherTextId = "fbddl-gather-text";
const gatherCountId = "fbddl-gather-count";
const fromInputId = "fbddl-from";
const toInputId = "fbddl-to";
const downloadButtonId = "fbddl-download";
const downloadRowId = "fbddl-download-row";
const gatherIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23000000' x='0px' y='0px' viewBox='21.55 21.55 56.9 56.9'%3E%3Ctitle%3EArtboard 52%3C/title%3E%3Cg data-name='Layer 2'%3E%3Cpath d='M22.83,54.17h23v23l-9.38-9.38L25.79,78.45l-4.24-4.24L32.21,63.55Zm45-17.71L78.45,25.79l-4.24-4.24L63.55,32.21l-9.38-9.38v23h23Zm9.38,17.71h-23v23l9.38-9.38L74.21,78.45l4.24-4.24L67.79,63.55ZM25.79,21.55l-4.24,4.24L32.21,36.45l-9.38,9.38h23v-23l-9.38,9.38Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E";
const downloadIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' fill='%23000000' version='1.1' x='0px' y='0px' enable-background='new 0 0 20 20' xml:space='preserve' viewBox='1 0 18 20'%3E%3Cg%3E%3Cpolygon fill='%23000000' points='11,12.2 11,7 9,7 9,12.2 7.5,10.7 6,12.1 10,16 14,12.1 12.5,10.7 '%3E%3C/polygon%3E%3Cpath fill='%23000000' d='M13.4,0H1v20h18V5.6L13.4,0z M14,3.4L15.6,5H14V3.4z M3,18V2h9v5h5v11H3z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E";
const loadingClass = "loading";
const downloadMax = 800;

let initialRequest;
let gatheredDocuments = [];

chrome.runtime.sendMessage({id:"loadCss"}, response => {
	createContent();
});

// window.addEventListener ("load", addDownloadButton, false);

function createContent() {
	let container = document.querySelector("div.dati1w0a.ihqw7lf3.hv4rvrfc.discj3wi");
	if (!container) {
		setTimeout(createContent, 100);
		return;
	}
	let contentDiv =  document.createElement("div");
	contentDiv.style.fontSize = "15px";
	contentDiv.style.marginTop = "15px";
	contentDiv.style.paddingTop = "7px";
	contentDiv.style.marginTop = "15px";
	contentDiv.style.borderTop = "1px solid var(--divider)";
	// contentDiv.style.display = "flex";
	// contentDiv.style.justifyContent = "flex-end";
	let gatherRow = createRow();
	let gatherText =  document.createElement("div");
	gatherText.id = gatherTextId;
	let gatherCountElement =  document.createElement("span");
	gatherCountElement.id = gatherCountId;
	gatherCountElement.innerText = "0";
	let gatherTextLabel = createLabel("Gesammelte Dokumente: ");
	gatherText.style.visibility = "hidden";
	gatherText.appendChild(gatherTextLabel);
	gatherText.appendChild(gatherCountElement);
	gatherRow.appendChild(gatherText);
	gatherRow.appendChild(createButton(gatherButtonId, gatherIcon, "Dokumente sammeln", onGatherButtonClicked));
	
	let downloadRow = createRow(downloadRowId);
	let minMaxContainer = document.createElement("span");
	minMaxContainer.appendChild(createLabel("Von: "));
	let fromInput = createInput(fromInputId);
	fromInput.addEventListener("input", () => {
		let toInput = document.querySelector("input#"+toInputId);
		to = parseInt(toInput.value);
		fromInput.value = fromInput.value > to ? to : fromInput.value;
		updateDownloadButton();
	});
	minMaxContainer.appendChild(fromInput);
	minMaxContainer.appendChild(createLabel("Nach: "));
	let toInput = createInput(toInputId);
	toInput.addEventListener("input", () => {
		let gatherCount = gatheredDocuments.length;
		toInput.value = toInput.value > gatherCount ? gatherCount : toInput.value;
		fromInput.value = fromInput.value <= toInput.value ? fromInput.value : toInput.value;
		updateDownloadButton();
	});
	minMaxContainer.appendChild(toInput);
	
	downloadRow.style.display = "none";
	downloadRow.appendChild(minMaxContainer);
	downloadRow.appendChild(createButton(downloadButtonId, downloadIcon, "Dokumente herunterladen", onDownloadButtonClicked));

	contentDiv.appendChild(gatherRow);
	contentDiv.appendChild(downloadRow);

	container.insertBefore(contentDiv, container.children[1]);
	// updateGatherCount(999);
	updateDownloadButton();
}

function updateDownloadButton() {
	let text = document.querySelector("button#"+downloadButtonId).firstChild.lastChild;
	text.innerText = getDownloadCount() +" Dokumente herunterladen";
	resizeButtons();
}

function resizeButtons() {
	let buttons = document.querySelectorAll("button."+buttonClass);
	let max = 0;
	for (const button of buttons) {
		if (button.offsetWidth > max) {
			max = button.offsetWidth;
		}
	}
	for (const button of buttons) {
		button.style.minWidth = max + "px";
	}
}

function getDownloadCount() {
	return document.querySelector("input#"+toInputId).value - document.querySelector("input#"+fromInputId).value + 1;
}

function updateGatherCount() {
	let count = gatheredDocuments.length;
	document.querySelector("span#"+gatherCountId).innerText = count;
	// document.querySelector("input#"+toInputId).max = count;
}

function createInput(id) {
	input = document.createElement("input");
	input.value = 1;
	input.id = id;
	input.type = "number";
	input.min = "1"
	input.style.fontSize = "14px";
	input.style.border = "none";
	input.style.borderBottom = "2px solid black";
	input.style.width = "3ch";
	input.addEventListener("input", resizeInput);
	resizeInput.call(input);
	// input.addEventListener('focusin', (event) => {
	// 	let element = event.target;
	// 	let width = parseInt(element.style.width.replace("ch","")) + 6;
	// 	console.log("width",width);
	// 	element.style.width = width + "ch";
	//   });
	return input;
}

function resizeInput() {
	let charCount = this.value.length > 0 ? this.value.length : 3;
	this.style.width = charCount + 3 + "ch";
}

function createLabel(text) {
	let label =  document.createElement("span");
	label.innerText = text;
	label.style.fontWeight = "bold";
	return label;
}

function createRow(id = null) {
	let content = document.createElement("div");
	content.id = id;
	content.className = rowClass;
	content.style.display = "flex";
	content.style.justifyContent = "space-between";
	content.style.alignItems = "center";
	content.style.marginTop = "5px";
	return content;
}

function createButton(id, icon, text, onClick) {
	let button = document.createElement("button");
	button.id = id;
	button.className = buttonClass;
    let content = document.createElement("div")
	content.className = buttonContentClass;
	content.style.display = "flex";
	content.style.justifyContent = "center";
	content.style.alignItems = "center";
	content.style.transition = "all 0.5s;";
	let iconElement = document.createElement("img");
	iconElement.src = icon;
	iconElement.style.filter = "invert(1)";
	iconElement.style.marginRight = "3px";
	iconElement.style.height = "16px";
	let textElement = document.createElement("span");
	textElement.style.marginBottom = "2px";
	textElement.innerText = text;
	content.appendChild(iconElement);
	content.appendChild(textElement);
	button.appendChild(content);
	button.onclick = onClick;
	return button;
}

async function onGatherButtonClicked() {
	if (this.classList.contains("loadingClass")) {
		return;
	}

	document.querySelector("div#"+gatherTextId).style.visibility = "visible";

	this.classList.add(loadingClass);
	chrome.runtime.sendMessage({ id: "getRequest" }, async request => {
		if (request) {
			initialRequest = request;
			gatheredDocuments = [];
			for await (let doc of loadDocuments(request)) {
				gatheredDocuments.push(doc);
				updateGatherCount();
			}
			console.log(gatheredDocuments);

			this.classList.remove(loadingClass);
			document.querySelector("div#"+downloadRowId).style.display = "flex";
			resizeButtons();
			let toInput = document.querySelector("input#"+toInputId);
			toInput.value = gatheredDocuments.length >= downloadMax ? downloadMax : gatheredDocuments.length;
			updateDownloadButton();
		}
		else {
			console.log("INITIAL GRAPH REQUEST NOT YET RECORDED!!");
		}
	});
}

async function onDownloadButtonClicked() {
	let from = document.querySelector("input#"+fromInputId).value;
	let to = document.querySelector("input#"+toInputId).value;
	for (const doc of gatheredDocuments.slice(from-1, to)) {
		downloadDocument(doc);
	}
}

async function downloadDocument(document) {
	if (document.type != documentType.facebookDocument) {
		chrome.runtime.sendMessage({ id: "download", document: document }, response => {
		});
		return;
	}
	let response;
	if (cToken == null) {
		response = await fetch(document.url, {headers: initialRequest.headers});
		const content = await response.text();
		const regex = /\"compat_iframe_token\":\"(\S*)\"/g;
		cToken = regex.exec(content)[1];
	}
	const url = `${document.url}?cquick=jsc_c_m&cquick_token=${cToken}&ctarget=https%3A%2F%2Fwww.facebook.com`;
	response =  await fetch(url, {headers: initialRequest.headers});
	const documentHtml = await response.text();
	
	// let blob = new Blob([documentHtml], {type: "text/plain"});

	chrome.runtime.sendMessage({ id: "download", document: document, html:coerceHtml(documentHtml) }, response => {
	});
}

function coerceHtml(html) {
	let e = document.createElement('html');
	e.innerHTML = html;
	e.querySelector("[data-referrer=page_footer]").remove();
	for (const node of e.querySelectorAll("script")) {
		node.remove();
	}
	e.querySelector("[data-testid=post_chevron_button").parentElement.remove();
	e.querySelector("div").style.marginBottom = "40px";
	return e.innerHTML;
}

async function* loadDocuments(request) {
	let body;
	while (body == null || body.page_info.has_next_page) {
		body = await loadDocumentsInfo(request);
		let variables = request.body.variables;
		if (Array.isArray(variables)) {
			variables = variables[0];
		}
		variables = JSON.parse(variables);
		variables.cursor = body.page_info.end_cursor;
		request.body.variables = JSON.stringify(variables);
		yield* createFacebookDocuments(body);
	}
}

async function loadDocumentsInfo(request) {
	let body = new URLSearchParams(request.body).toString();
	const response = await fetch(request.url, {
		method: 'POST',
		headers: request.headers,
		body: body
	});
	body = await response.json();
	body = body.data.node.group_docs_and_files;
	return body;
}

const documentType = {
	unknown: 0,
	facebookDocument: 1,
	wordDocument: 2,
	pdf: 3,
	file: 4,
}

function* createFacebookDocuments(data) {
	const documents = data.edges;
	for (let document of documents) {
		let doc = {};
		const node = document.node;
		doc.name = node.name.trim();
		doc.name = trim(doc.name, '\r');
		doc.name = trim(doc.name, '\n');
		switch (node.file_type_name) {
			case "Dokument":
				doc.type = node.download_url == null ? documentType.facebookDocument : documentType.wordDocument;
				break;
			case "Datei":
				doc.type = documentType.file;
				break;
			case "PDF":
				doc.type = documentType.pdf;
				break;
			default:
				doc.type = documentType.unknown;
				break;
		}
		doc.url = node.download_url == null ? node.preview_url : node.download_url;
		doc.timestamp = new Date(node.original_post.creation_time * 1000);
		yield doc;
	}
}

//https://stackoverflow.com/a/55292366
function trim(str, ch) {
    let start = 0, 
        end = str.length;

    while(start < end && str[start] === ch)
        ++start;

    while(end > start && str[end - 1] === ch)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}