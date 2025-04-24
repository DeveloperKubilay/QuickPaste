(() => {
    const QP_PREFIX = 'qp_' + Math.random().toString(36).substr(2, 8) + '_';
    let uiHtmlContent;
    let container;
    let target;
    let defaultBrowseInput;

    fetch(chrome.runtime.getURL("ui.html"))
        .then(res => res.text())
        .then(html => {
            uiHtmlContent = html
                .replace(/ext_QuickPaste_form/g, QP_PREFIX + 'form')
                .replace(/ext_QuickPaste_form_texts/g, QP_PREFIX + 'form_texts')
                .replace(/ext_QuickPaste_ctrlv/g, QP_PREFIX + 'ctrlv')
                .replace(/ext_QuickPaste_form_browse/g, QP_PREFIX + 'form_browse')
                .replace(/dragover/g, QP_PREFIX + 'dragover')
                .replace(/ext_QuickPaste_form_drop/g, QP_PREFIX + 'form_drop');
        });

    document.addEventListener('dragover', function(e) {
        if (container) {
            e.preventDefault();
            container.classList.add(QP_PREFIX + 'dragover');
        }
    });

    document.addEventListener('dragleave', function(e) {
        if (container && (e.clientX <= 0 || e.clientY <= 0 || 
            e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
            e.preventDefault();
            container.classList.remove(QP_PREFIX + 'dragover');
        }
    });

    document.addEventListener('drop', function(e) {
        if (container) {
            e.preventDefault();
            container.classList.remove(QP_PREFIX + 'dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                finish(e.dataTransfer.files);
            }
        }
    });

    function findAllFileInputs() {
        const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
        function findInShadow(root) {
            let found = [];
            if (root.shadowRoot) {
                found = found.concat(Array.from(root.shadowRoot.querySelectorAll('input[type="file"]')));
                root.shadowRoot.querySelectorAll('*').forEach(el => {
                    found = found.concat(findInShadow(el));
                });
            }
            return found;
        }
        document.querySelectorAll('*').forEach(el => {
            inputs.push(...findInShadow(el));
        });
        return inputs;
    }

    function attachInputListeners() {
        findAllFileInputs().forEach(input => {
            if (input._quickpaste_attached) return;
            input._quickpaste_attached = true;
            input.addEventListener('click', function(event) {
                if (container && document.body.contains(container)) {
                    container.click();
                    event.preventDefault();
                    return;
                }
                finish();

                const mouseX = event.clientX;
                const mouseY = event.clientY;

                container = document.createElement("div");
                container.id = QP_PREFIX + 'form';
                container.innerHTML = uiHtmlContent;
                container.style.position = 'absolute';
                container.style.zIndex = '2147483647';
                container.style.visibility = 'hidden';
                document.body.appendChild(container);

                const rect = container.getBoundingClientRect();
                let left = mouseX + window.scrollX - rect.width / 2;
                let top = mouseY + window.scrollY - rect.height / 2;
                left = Math.max(0, Math.min(left, window.innerWidth + window.scrollX - rect.width));
                top = Math.max(0, Math.min(top, window.innerHeight + window.scrollY - rect.height));
                container.style.left = left + 'px';
                container.style.top = top + 'px';
                container.style.visibility = 'visible';

                target = input;

                function handleOutsideClick(e) {
                    if (container && !container.contains(e.target)) {
                        finish();
                        document.removeEventListener('mousedown', handleOutsideClick, true);
                    }
                }
                setTimeout(() => {
                    document.addEventListener('mousedown', handleOutsideClick, true);
                }, 0);

                container.addEventListener("click", function (e) {
                    e.stopPropagation();
                    const oldTempInput = document.getElementById(QP_PREFIX + 'temp_input');
                    if (oldTempInput) {
                        document.body.removeChild(oldTempInput);
                    }
                    const tempInput = document.createElement('input');
                    tempInput.type = 'file';
                    if (target && target.multiple) {
                        tempInput.multiple = true;
                    }
                    tempInput.style.display = 'none';
                    tempInput.id = QP_PREFIX + 'temp_input';
                    document.body.appendChild(tempInput);
                    defaultBrowseInput = tempInput;

                    tempInput.addEventListener('change', function () {
                        if (tempInput.files.length > 0 && target) {
                            finish(tempInput.files);
                        };
                    });
                    tempInput.click();
                });

                event.preventDefault();
            }, true);
        });
    }

    const observer = new MutationObserver(() => {
        attachInputListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    attachInputListeners();

    function finish(x) {
        if (x) {
            if (target && !target.multiple && x.length > 0) {
                const dt = new DataTransfer();
                dt.items.add(x[0]);
                target.files = dt.files;
            } else if (target) {
                target.files = x;
            }
            if (target) target.dispatchEvent(new Event('change', { bubbles: true }));
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
        const oldTempInput = document.getElementById(QP_PREFIX + 'temp_input');
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
            if (!fileInput.multiple && event.clipboardData.files.length > 0) {
                const dt = new DataTransfer();
                dt.items.add(event.clipboardData.files[0]);
                fileInput.files = dt.files;
            } else {
                fileInput.files = event.clipboardData.files;
            }
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
})();
