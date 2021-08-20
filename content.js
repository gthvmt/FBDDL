let cToken;
const infoTextId = "fbddl-info";
const infoTextNumberId = "fbddl-infotext-num";
const infoContainerId = "fbddl-container";

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
const progressRowId = "fbddl-progress-row";
const progressBarId = "fbddl-progress";
const progressClass = "progress";
const gatherIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23000000' x='0px' y='0px' viewBox='21.55 21.55 56.9 56.9'%3E%3Ctitle%3EArtboard 52%3C/title%3E%3Cg data-name='Layer 2'%3E%3Cpath d='M22.83,54.17h23v23l-9.38-9.38L25.79,78.45l-4.24-4.24L32.21,63.55Zm45-17.71L78.45,25.79l-4.24-4.24L63.55,32.21l-9.38-9.38v23h23Zm9.38,17.71h-23v23l9.38-9.38L74.21,78.45l4.24-4.24L67.79,63.55ZM25.79,21.55l-4.24,4.24L32.21,36.45l-9.38,9.38h23v-23l-9.38,9.38Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E";
const downloadIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' fill='%23000000' version='1.1' x='0px' y='0px' enable-background='new 0 0 20 20' xml:space='preserve' viewBox='1 0 18 20'%3E%3Cg%3E%3Cpolygon fill='%23000000' points='11,12.2 11,7 9,7 9,12.2 7.5,10.7 6,12.1 10,16 14,12.1 12.5,10.7 '%3E%3C/polygon%3E%3Cpath fill='%23000000' d='M13.4,0H1v20h18V5.6L13.4,0z M14,3.4L15.6,5H14V3.4z M3,18V2h9v5h5v11H3z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E";
const loadingClass = "loading";
const downloadMax = 800;

let initialRequest;
let initialFiles;
let groupId;

let gatheredDocuments = [];

let currentDocId = 1;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.id === "downloadFailed") {
    console.log(
      `\"${message.document.name}\" has an invalid filename and was renamed to ${message.id}.html`
    );
  }
  sendResponse(null);
});

chrome.runtime.sendMessage({ id: "loadCss" }, (response) => {
  console.log("CSS loaded");
  createContent();
});

// window.addEventListener ("load", addDownloadButton, false);

let observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.type === "attributes" &&
      mutation.target.ariaLabel == "Dateien durchsuchen"
    ) {
      createContent();
      // console.log(mutation);
    }
  }
});

function createContent() {
  let container = document.querySelector(
    "div.dati1w0a.ihqw7lf3.hv4rvrfc.discj3wi"
  );
  if (!container) {
    console.log("element not yet loaded, retrying in 100ms");
    setTimeout(createContent, 100);
    return;
  }

  if (document.querySelector("span#" + gatherCountId)) {
    console.log("Content already injected");
    return;
  }

  // const matches = document.body.innerHTML.matchAll(/(group_docs_and_files: {(.*)),(.*)draft_fb_notes/gs);
  initialFiles = document.body.innerHTML.match(/("group_docs_and_files"?:{(.*)),(.*)draft_fb_notes/s)[1];
  initialFiles = JSON.parse("{" + initialFiles + "}");
  groupId = document.body.innerHTML.match(/"groupID":"((\d)+)"/)[1]
//   console.log("initial files: ", initialFiles)
//   debugger;

  console.log("creating container...");

  let contentDiv = document.createElement("div");
  contentDiv.style.fontSize = "15px";
  contentDiv.style.marginTop = "15px";
  contentDiv.style.paddingTop = "7px";
  contentDiv.style.marginTop = "15px";
  contentDiv.style.borderTop = "1px solid var(--divider)";
  // contentDiv.style.display = "flex";
  // contentDiv.style.justifyContent = "flex-end";
  let gatherRow = createRow();
  let gatherText = document.createElement("div");
  gatherText.id = gatherTextId;
  let gatherCountElement = document.createElement("span");
  gatherCountElement.id = gatherCountId;
  gatherCountElement.innerText = "0";
  let gatherTextLabel = createLabel("Gesammelte Dokumente: ");
  gatherText.style.visibility = "hidden";
  gatherText.appendChild(gatherTextLabel);
  gatherText.appendChild(gatherCountElement);
  gatherRow.appendChild(gatherText);
  gatherRow.appendChild(
    createButton(
      gatherButtonId,
      gatherIcon,
      "Dokumente sammeln",
      onGatherButtonClicked
    )
  );

  let downloadRow = createRow(downloadRowId);
  let minMaxContainer = document.createElement("span");
  minMaxContainer.appendChild(createLabel("Von: "));
  let fromInput = createInput(fromInputId);
  fromInput.addEventListener("input", () => {
    let toInput = document.querySelector("input#" + toInputId);
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
    fromInput.value =
      fromInput.value <= toInput.value ? fromInput.value : toInput.value;
    updateDownloadButton();
  });
  minMaxContainer.appendChild(toInput);

  downloadRow.style.display = "none";
  downloadRow.appendChild(minMaxContainer);
  downloadRow.appendChild(
    createButton(
      downloadButtonId,
      downloadIcon,
      "Dokumente herunterladen",
      onDownloadButtonClicked
    )
  );

  let progressRow = createRow(progressRowId);
  progressRow.style.display = "none";
  const progressBarContainer = document.createElement("div");
  const progressBar = document.createElement("div");
  progressBarContainer.className = progressClass;
  progressBar.id = progressBarId;
  progressBar.appendChild(document.createElement("span"));
  progressBarContainer.appendChild(progressBar);
  progressRow.appendChild(progressBarContainer);

  contentDiv.appendChild(gatherRow);
  contentDiv.appendChild(downloadRow);
  contentDiv.appendChild(progressRow);

  container.insertBefore(contentDiv, container.children[1]);

  console.log("Container created", contentDiv);
  updateDownloadButton();
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: false,
  });
}

function updateDownloadButton() {
  let text = document.querySelector("button#" + downloadButtonId).firstChild
    .lastChild;
  text.innerText = getDownloadCount() + " Dokumente herunterladen";
  resizeButtons();
}

function resizeButtons() {
  let buttons = document.querySelectorAll("button." + buttonClass);
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
  return (
    document.querySelector("input#" + toInputId).value -
    document.querySelector("input#" + fromInputId).value +
    1
  );
}

function updateGatherCount() {
  let count = gatheredDocuments.length;
  document.querySelector("span#" + gatherCountId).innerText = count;
  // document.querySelector("input#"+toInputId).max = count;
}

function createInput(id) {
  input = document.createElement("input");
  input.value = 1;
  input.id = id;
  input.type = "number";
  input.min = "1";
  input.style.fontSize = "14px";
  input.style.border = "none";
  input.style.borderBottom = "2px solid var(--primary-text)";
  input.style.width = "3ch";
  input.style.background = "var(--surface-background)";
  input.style.color = "var(--primary-text)";
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
  let label = document.createElement("span");
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
  let content = document.createElement("div");
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
  if (this.classList.contains(loadingClass)) {
    return;
  }

  document.querySelector("div#" + gatherTextId).style.visibility = "visible";

  this.classList.add(loadingClass);
  chrome.runtime.sendMessage({ id: "getRequest" }, async (request) => {
    if (request) {
      initialRequest = request;
      request.headers["X-FB-Friendly-Name"] =
        "GroupsCometFilesTabPaginationQuery";
      request.body.doc_id = 3308167249219247;
      request.body.variables = JSON.stringify({
        count: 15,
        cursor: null,
        groupDocsFileName: null,
        groupID: groupId,
        orderby: null,
        scale: 1,
        id: groupId,
      });
      console.log(request.body);
      initialRequest = request;
      gatheredDocuments = [];
      for await (let doc of loadDocuments(request)) {
        gatheredDocuments.push(doc);
        updateGatherCount();
      }
      console.log(gatheredDocuments);

      this.classList.remove(loadingClass);
      document.querySelector("div#" + downloadRowId).style.display = "flex";
      resizeButtons();
      let toInput = document.querySelector("input#" + toInputId);
      toInput.value =
        gatheredDocuments.length /
        Math.ceil(gatheredDocuments.length / downloadMax);
      updateDownloadButton();
    } else {
      console.log("INITIAL GRAPH REQUEST NOT YET RECORDED!!");
    }
  });
}

async function onDownloadButtonClicked() {
  if (this.classList.contains(loadingClass)) {
    return;
  }
  this.classList.add(loadingClass);
  const gatherButton = document.querySelector("button#" + gatherButtonId);
  gatherButton.disabled = true;

  const from = document.querySelector("input#" + fromInputId).value;
  const to = document.querySelector("input#" + toInputId).value;
  const documentsToDownload = gatheredDocuments.slice(from - 1, to);

  const progressRow = document.querySelector("div#" + progressRowId);
  const progressBar = document.querySelector("div#" + progressBarId);
  const progressInfo = progressBar.firstChild;
  let count = 0;

  progressBar.style.width = "0";
  progressRow.style.display = "flex";
  progressBar.style.removeProperty("background");

  let fileNames = [];

  try {
    const blobWriter = new window.zip.BlobWriter("application/zip");
    const writer = new window.zip.ZipWriter(blobWriter);

    for (const doc of documentsToDownload) {
      console.log("loading",doc);
      blob = await createDocumentBlob(doc);
      let fileName =
        coerceFileName(doc.name, "_") +
        (doc.type == documentType.facebookDocument ? ".html" : "");
      if (fileNames.includes(fileName)) {
        let count = fileNames.reduce((n, x) => n + (x === fileName), 0);
        fileNames.push(fileName);
        const ext = fileName.match(/\.[^/.]+$/);
        fileName = fileName.replace(ext, "") + ` (${count})` + ext;
        console.log("new filename:", fileName);
      } else {
        fileNames.push(fileName);
      }
      if (blob) {
        await writer.add(fileName, new window.zip.BlobReader(blob));
        count++;
        progressBar.style.width =
          (count * 100) / documentsToDownload.length + "%";
        progressInfo.innerText = `${count}/${documentsToDownload.length}`;
      }
    }
    // close the ZipReader
    await writer.close();

    // get the zip file as a Blob
    const zip = await blobWriter.getData();

    window.saveAs(zip, `Documents ${from}-${to}.zip`);
  } catch (error) {
    progressBar.style.background = "red";
    throw error;
  } finally {
    gatherButton.disabled = false;
    this.classList.remove(loadingClass);
    setTimeout(() => (progressRow.style.display = "none"), 2000);
  }
}

function base64UrlToBlob(base64Url) {
  const parts = base64Url.split(",");
  const type = parts[0].split(":")[1].split(";")[0];
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: type });
}

async function createDocumentBlob(document) {
  if (document.type != documentType.facebookDocument) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { id: "getBlobUrl", url: document.url },
        (blobUrl) => resolve(base64UrlToBlob(blobUrl))
      );
    });
  }
  let response;
  //get ctoken first which can then be reused for all the other documents
  if (!cToken) {
    response = await fetch(document.url, { headers: initialRequest.headers });
    const content = await response.text();
    const regex = /\"compat_iframe_token\":\"((\w|-)+?)\"/g;
    cToken = regex.exec(content)[1];
  }
  const url = `${document.url}?cquick=jsc_c_m&cquick_token=${cToken}&ctarget=https%3A%2F%2Fwww.facebook.com`;
  response = await fetch(url, { headers: initialRequest.headers });
  const documentHtml = await response.text();
  const html = await coerceHtml(documentHtml);
  return new Blob([html], { type: "text/html" });
}

function coerceFileName(fileName, illegalCharacterReplacement) {
  if (fileName == "") {
    return "_";
  }
  fileName = fileName.replace(
    /(<|>|:|"|\/|\\|\||\?|\*)/g,
    illegalCharacterReplacement
  );
  fileName = fileName.replace(/(?:\r\n|\r|\n)/g, " ");
  return fileName;
}

async function coerceHtml(html) {
  const e = document.createElement("html");
  e.innerHTML = html;
  try {
    e.querySelector("[data-referrer=page_footer]").remove();
    for (const node of e.querySelectorAll("script")) {
      node.remove();
    }
    e.querySelector("[data-testid=post_chevron_button").parentElement.remove();
    e.querySelector("div").style.marginBottom = "40px";
    e.querySelector("div._5i8r")?.remove();

    for (const node of e.querySelectorAll("link")) {
      if (node.hasAttribute("as") && node.as === "script") {
        node.remove();
      }
    }

    const imgRegex =
      /((&quot;)?https:((\\)?\/){2}scontent\.fdtm\d-\d\.fna\.fbcdn\.net\S+?)\)/gm;
    for (const match of e.innerHTML.matchAll(imgRegex)) {
      let imgUrl = match[1];
      imgUrl = htmlDecode(imgUrl);
      if (imgUrl.startsWith('"')) {
        imgUrl = imgUrl.replace(/\\\//g, "/").slice(1, -1);
      }

      e.innerHTML = await new Promise((resolve, reject) =>
        chrome.runtime.sendMessage(
          { id: "getBlobUrl", url: imgUrl },
          (blobUrl) => {
            resolve(e.innerHTML.replace(match[1], blobUrl));
          }
        )
      );
    }

    return e.innerHTML;
  } catch (error) {
    console.log("You are probably being rate limited :(");
    throw error;
  }
}

const htmlDecode = (input) =>
  new DOMParser().parseFromString(input, "text/html").documentElement
    .textContent;

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
  currentDocId = 1;
}

async function loadDocumentsInfo(request) {
  let body = new URLSearchParams(request.body).toString();
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: body,
  });
  // debugger;
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
};

function* createFacebookDocuments(data) {
  const documents = data.edges;
  for (let document of documents) {
    let doc = {};
    const node = document.node;
    doc.id = currentDocId++;
    doc.name = node.name.trim();
    doc.name = trim(doc.name, "\r");
    doc.name = trim(doc.name, "\n");
    switch (node.file_type_name) {
      case "Dokument":
        doc.type =
          node.download_url == null
            ? documentType.facebookDocument
            : documentType.wordDocument;
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
    // doc.url = node.download_url == null ? node.preview_url : node.download_url;
    doc.url = node.preview_url;
    doc.timestamp = new Date(node.original_post.creation_time * 1000);
    yield doc;
  }
}

//https://stackoverflow.com/a/55292366
function trim(str, ch) {
  let start = 0,
    end = str.length;

  while (start < end && str[start] === ch) ++start;

  while (end > start && str[end - 1] === ch) --end;

  return start > 0 || end < str.length ? str.substring(start, end) : str;
}
