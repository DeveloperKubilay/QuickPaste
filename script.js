let uiHtmlContent;
let container;
let target;
let defaultBrowseInput;

fetch(chrome.runtime.getURL("ui.html"))
    .then(res => res.text())
    .then(html => {
        uiHtmlContent = html;
    });

document.addEventListener('dragover', function(e) {
    if (container) {
        e.preventDefault();
        container.classList.add('dragover');
    }
});

document.addEventListener('dragleave', function(e) {
    if (container && (e.clientX <= 0 || e.clientY <= 0 || 
        e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        e.preventDefault();
        container.classList.remove('dragover');
    }
});

document.addEventListener('drop', function(e) {
    if (container) {
        e.preventDefault();
        container.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            finish(e.dataTransfer.files);
        }
    }
});

document.body.addEventListener('click', function (event) {
    let Temp_target = event.target;
    if (
        container &&
        !container.contains(event.target) &&
        event.target.id != 'ext_quickpaste_temp_input' &&
        event.target != target
    ) finish();


    if (
        Temp_target.tagName != 'INPUT' ||
        Temp_target.tagName === 'INPUT' && Temp_target.type != 'file' ||
        defaultBrowseInput == Temp_target
    ) return;
   
    if (container && Temp_target === target && document.body.contains(container)) {
        container.click();
        return event.preventDefault();
    }
    finish();

    const rect = Temp_target.getBoundingClientRect();

    container = document.createElement("div");
    container.id = 'ext_QuickPaste_form';
    container.innerHTML = uiHtmlContent;
    container.style.position = 'absolute';
    container.style.top = (rect.bottom + window.scrollY) + 15 + 'px';
    container.style.left = (rect.left + window.scrollX) + 'px';
    container.style.zIndex = '9999';

    target = Temp_target;

    container.addEventListener("click", function (e) {
        e.stopPropagation();
        const oldTempInput = document.getElementById('ext_quickpaste_temp_input');
        if (oldTempInput) {
            document.body.removeChild(oldTempInput);
        }
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.style.display = 'none';
        tempInput.id = 'ext_quickpaste_temp_input';
        document.body.appendChild(tempInput);
        defaultBrowseInput = tempInput;

        tempInput.addEventListener('change', function () {
            if (tempInput.files.length > 0 && target) {
                finish(tempInput.files);
            };
        });
        tempInput.click();
    });

    document.body.appendChild(container);
    event.preventDefault();
})

function finish(x) {
    if (x) {
        target.files = x;
        target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (defaultBrowseInput) {
        document.body.removeChild(defaultBrowseInput);
        defaultBrowseInput = null;
    }
    if (container) {
        document.body.removeChild(container);
        container = null;
    }
    if (target) target = null;
    const oldTempInput = document.getElementById('ext_quickpaste_temp_input');
    if (oldTempInput) {
        document.body.removeChild(oldTempInput);
    }
}

document.addEventListener('paste', function (event) {
    if (container && event.clipboardData && event.clipboardData.files.length > 0) {
        event.preventDefault();
        finish(event.clipboardData.files);
    } 
    else if (document.activeElement && 
             document.activeElement.tagName === 'INPUT' && 
             document.activeElement.type === 'file' &&
             event.clipboardData && 
             event.clipboardData.files.length > 0) {
        event.preventDefault();
        const fileInput = document.activeElement;
        fileInput.files = event.clipboardData.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
});