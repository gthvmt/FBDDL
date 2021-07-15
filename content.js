let cToken;
const infoTextId = "fbddl-info"
const infoTextNumberId = "fbddl-infotext-num"
const progressBarId = "fbddl-progress"
const infoContainerId ="fbddl-container";

addDownloadButton();
// window.addEventListener ("load", addDownloadButton, false);

function updateInfoTextNumber(newNumber) {
	let number = document.querySelector("div#"+infoTextNumberId);
	if (!number) {
		createInfoText();
		number = document.querySelector("div#"+infoTextNumberId);
	}
	number.textContent = newNumber;
}

function createInfoText() {
	let tabLists = document.querySelectorAll("[role=tablist]");
	let wideTabList = tabLists[1];
	wideTabList = wideTabList.firstChild.lastChild;
	let ele = document.createElement("a");
	ele.id = infoContainerId;
	ele.style.position = "relative";
	ele.style.top = "30px";
	ele.style.left = "10px";
	ele.style.color = "black";
	ele.style["text-decoration"] = "none";
	let text = document.createElement("div")
	text.style["font-size"] = "16px";
	text.innerHTML = `Es wurden <div id=${infoTextNumberId} style="display:inline-block;">0</div> Dokumente geladen`;
	text.id = infoTextId;
	ele.appendChild(text);
	wideTabList.appendChild(ele);
	return text;
}

function createProgressBar() {
	let container = document.querySelector("a#"+infoContainerId);
	let max = document.querySelector("div#"+infoTextNumberId).textContent;
	container.innerHTML = "";
	container.style.top = "0px";
	let progressBarContainer = document.createElement("div");
	let progressBar = document.createElement("progress");
	progressBar.max = max;
	progressBar.value = 0;
	progressBar.style.height = "60px";
	progressBar.style.width = "300px";
	progressBar.id = progressBarId;
	progressBarContainer.appendChild(progressBar);
	container.appendChild(progressBarContainer);
	return progressBar;
}

function addDownloadButton() {
	let all = document.querySelectorAll("[aria-label=Suchen]");
	if (all.length < 3) {
		// console.log("CANT FIND BUTTON PARENT YET, TRYING AGAIN IN 100MS")
		setTimeout(addDownloadButton, 100);
		return;
	}
	for (const e of all) {		
		let ele = e.parentElement;
		let parent = ele.parentElement;
		let dupe = ele.cloneNode(true);
		let imgContainer = dupe.firstChild.firstChild;
		imgContainer.innerHTML = "";
		ele.parentElement.prepend(dupe);
		// console.log(parent);
		let img = document.createElement('img');
		img.src="data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIwIDIwIiB4bWw6c3BhY2U9InByZXNlcnZlIj48Zz48cG9seWdvbiBmaWxsPSIjMDAwMDAwIiBwb2ludHM9IjExLDEyLjIgMTEsNyA5LDcgOSwxMi4yIDcuNSwxMC43IDYsMTIuMSAxMCwxNiAxNCwxMi4xIDEyLjUsMTAuNyAgIj48L3BvbHlnb24+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTEzLjQsMEgxdjIwaDE4VjUuNkwxMy40LDB6IE0xNCwzLjRMMTUuNiw1SDE0VjMuNHogTTMsMThWMmg5djVoNXYxMUgzeiI+PC9wYXRoPjwvZz48L3N2Zz4";
		img.style.maxHeight = "55%";
		imgContainer.appendChild(img);
		dupe.onclick = onButtonClicked;
		console.log(ele);
	}

}

async function onButtonClicked() {
	chrome.runtime.sendMessage({ id: "downloadButtonClicked" }, async request => {
		if (request) {
			let documents = [];
			count = 1;
			for await (let doc of loadDocuments(request)) {
				// console.log(count++);
				updateInfoTextNumber(count++);
				documents.push(doc);
			}
			console.log(documents);
			let progressBar = createProgressBar();
			count = 1;
			for (const doc of documents) {
				downloadDocument(doc, request.headers);
				progressBar.value = count++;
			}
		}
		else {
			console.log("INITIAL GRAPH REQUEST NOT YET RECORDED!!");
		}
	});
}

async function downloadDocument(document, headers) {
	if (document.type != documentType.facebookDocument) {
		chrome.runtime.sendMessage({ id: "download", document: document }, response => {
		});
		return;
	}
	console.log("TYPE IS FB DOC")
	let response;
	if (cToken == null) {
		response = await fetch(document.url, {headers: headers});
		const content = await response.text();
		const regex = /\"compat_iframe_token\":\"(\S*)\"/g;
		cToken = regex.exec(content)[1];
	}
	const url = `${document.url}?cquick=jsc_c_m&cquick_token=${cToken}&ctarget=https%3A%2F%2Fwww.facebook.com`;
	response =  await fetch(url, {headers: headers});
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
    var start = 0, 
        end = str.length;

    while(start < end && str[start] === ch)
        ++start;

    while(end > start && str[end - 1] === ch)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}