let graphRequests = []
// chrome.storage.local.clear()
chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message.id === "getRequest") {
      chrome.storage.local.get("initialRequest", response => {
        console.log("INITIAL REQUEST:",response.initialRequest);
        if (!response.initialRequest) {
          sendResponse(null);
          return;
        }
        sendResponse(response.initialRequest);
      })
      return true;
    }
    else if (message.id === "download") {
      sendResponse(null);
      let html = message.html;

      if (!html) {
        chrome.downloads.download({
          url: message.document.url,
        });
        return;
      }
      
      // createZip(html)
		  let blob = new Blob([html], {type: "text/html"});

      let fileName = coerceFileName(message.document.name, "_") + ".html";
        
        blobToBase64(blob, data => {
        chrome.downloads.download({
          url: data,
          filename: fileName,
        }, callback => {
          let error = chrome.runtime.lastError;
          if(error) {
            chrome.tabs.sendMessage(sender.tab.id, {id:"downloadFailed", document:message.document});
            chrome.downloads.download({
              url: data,
              filename: document.id+".html",
            });
          }
        })
        });
      }
    else if (message.id === "loadCss") {
      chrome.scripting.insertCSS({
        target: {tabId: sender.tab.id},
        files: ["styles.css"]
      }, () => {
        sendResponse(null);
      });
      return true;
    }
    else if (message.id === "getBlobUrl") {
      fetch(message.url).then(res => res.blob()).then(blob => blobToBase64(blob, b64 => sendResponse(b64)));
      return true;
    }
});

function blobToBase64(blob, callback) {
  var reader = new FileReader();
  reader.onload = () => {
      var dataUrl = reader.result;
      callback(dataUrl);
  };
  reader.readAsDataURL(blob);
}

function coerceFileName(fileName, illegalCharacterReplacement) {
  if (fileName == "") {
    return "_";
  }
  fileName = fileName.replace(/(<|>|:|"|\/|\\|\||\?|\*)/g, illegalCharacterReplacement);
  fileName = fileName.replace(/(?:\r\n|\r|\n)/g, ' ');
  return fileName;
}

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest , { urls: ["*://www.facebook.com/api/graphql/"] }, ["requestBody"]);
chrome.webRequest.onSendHeaders.addListener(onSendHeaders, { urls: ["*://www.facebook.com/api/graphql/"] }, ["requestHeaders", "extraHeaders"]);

function onBeforeRequest(details) {
  if (!graphRequests) {
    graphRequests = [];
  }
  graphRequests.push({
    id: details.requestId,
    body: details.requestBody.formData,
    url: details.url
  });
  return { cancel: false };
}

function onSendHeaders(details) {
  let request = graphRequests.find(obj => obj.id === details.requestId);

  if (request == undefined) {
    console.log(`GraphRequest #${details.requestId} not found`)
    return;
  }
  else {
    request.headers = {}
    details.requestHeaders.forEach(element => {
      request.headers[element.name] = element.value;
    });
  }
  // if (request.headers["X-FB-Friendly-Name"] == "GroupsCometFilesTabPaginationQuery") {

    console.log("SAVED INITIAL REQUEST");
    chrome.storage.local.set({initialRequest:request});
    chrome.webRequest.onSendHeaders.removeListener(onBeforeRequest);
    chrome.webRequest.onSendHeaders.removeListener(onSendHeaders);
  
}