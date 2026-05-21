const lightbox = document.querySelector("#image-lightbox");
        const lightboxImage = lightbox.querySelector("img");
        const lightboxCaption = lightbox.querySelector("p");
        const closeLightbox = lightbox.querySelector(".lightbox-close");

        document.querySelectorAll(".figure-card img").forEach((image) => {
            image.addEventListener("click", () => {
                const caption = image.closest("figure")?.querySelector("figcaption")?.textContent || image.alt;
                lightboxImage.src = image.src;
                lightboxImage.alt = image.alt;
                lightboxCaption.textContent = caption;
                lightbox.classList.add("is-open");
                lightbox.setAttribute("aria-hidden", "false");
            });
        });

        function hideLightbox() {
            lightbox.classList.remove("is-open");
            lightbox.setAttribute("aria-hidden", "true");
            lightboxImage.src = "";
        }

        closeLightbox.addEventListener("click", hideLightbox);
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) {
                hideLightbox();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
                hideLightbox();
            }
        });

const referenceBrowser = document.querySelector("[data-reference-source]");

if (referenceBrowser) {
    const source = referenceBrowser.dataset.referenceSource;
    const embeddedData = document.querySelector("#reference-data");
    const searchInput = document.querySelector("#reference-search");
    const typeSelect = document.querySelector("#reference-type");
    const countEl = document.querySelector("#reference-count");
    const listEl = document.querySelector("#reference-list");
    const errorEl = document.querySelector("#reference-error");
    let references = [];

    try {
        if (embeddedData?.textContent.trim()) {
            initializeReferences(JSON.parse(embeddedData.textContent));
        } else {
            fetch(source)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Reference CSV failed to load.");
                    }
                    return response.text();
                })
                .then((csvText) => {
                    initializeReferences(parseCsv(csvText).map(normalizeReference));
                })
                .catch(showReferenceError);
        }
    } catch {
        showReferenceError();
    }

    function showReferenceError() {
            countEl.textContent = "References unavailable";
            errorEl.hidden = false;
    }

    function initializeReferences(items) {
        references = items;
        populateReferenceTypes(references);
        renderReferences();
    }

    searchInput.addEventListener("input", renderReferences);
    typeSelect.addEventListener("change", renderReferences);

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;
        const cleanText = text.replace(/^\uFEFF/, "");

        for (let index = 0; index < cleanText.length; index += 1) {
            const char = cleanText[index];
            const nextChar = cleanText[index + 1];

            if (char === "\"" && inQuotes && nextChar === "\"") {
                field += "\"";
                index += 1;
            } else if (char === "\"") {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                row.push(field);
                field = "";
            } else if ((char === "\n" || char === "\r") && !inQuotes) {
                if (char === "\r" && nextChar === "\n") {
                    index += 1;
                }
                row.push(field);
                if (row.some((value) => value.trim() !== "")) {
                    rows.push(row);
                }
                row = [];
                field = "";
            } else {
                field += char;
            }
        }

        if (field || row.length) {
            row.push(field);
            rows.push(row);
        }

        const headers = rows.shift() || [];
        return rows.map((values) => {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index] || "";
            });
            return entry;
        });
    }

    function normalizeReference(entry) {
        const doi = entry.DOI.trim();
        const url = entry.Url.trim() || (doi ? `https://doi.org/${doi}` : "");

        return {
            type: entry["Item Type"].trim() || "reference",
            year: entry["Publication Year"].trim(),
            authors: entry.Author.trim(),
            title: stripHtml(entry.Title.trim()),
            publication: entry["Publication Title"].trim(),
            doi,
            url,
            abstract: stripHtml(entry["Abstract Note"].trim()),
        };
    }

    function populateReferenceTypes(items) {
        const types = [...new Set(items.map((item) => item.type).filter(Boolean))].sort();
        types.forEach((type) => {
            const option = document.createElement("option");
            option.value = type;
            option.textContent = formatType(type);
            typeSelect.appendChild(option);
        });
    }

    function renderReferences() {
        const query = searchInput.value.trim().toLowerCase();
        const type = typeSelect.value;
        const filtered = references.filter((item) => {
            const matchesType = type === "all" || item.type === type;
            const haystack = [
                item.title,
                item.authors,
                item.year,
                item.publication,
                item.doi,
                item.abstract,
                formatType(item.type),
            ].join(" ").toLowerCase();
            return matchesType && haystack.includes(query);
        });

        filtered.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
        countEl.textContent = `${filtered.length} of ${references.length} references shown`;
        listEl.innerHTML = filtered.map(referenceCard).join("");
    }

    function referenceCard(item) {
        const meta = [
            item.authors,
            item.year,
            item.publication,
        ].filter(Boolean).map(escapeHtml).join(" · ");
        const abstract = item.abstract ? `<p class="reference-abstract">${escapeHtml(truncate(item.abstract, 420))}</p>` : "";
        const doiLink = item.doi ? `<a href="${escapeAttribute(`https://doi.org/${item.doi}`)}" target="_blank" rel="noopener noreferrer">DOI</a>` : "";
        const urlLink = item.url ? `<a href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">Open source</a>` : "";

        return `
            <article class="reference-card">
                <h2>${escapeHtml(item.title || "Untitled reference")}</h2>
                <p class="reference-meta">${meta}</p>
                ${abstract}
                <div class="reference-actions">
                    <span class="reference-type-pill">${escapeHtml(formatType(item.type))}</span>
                    ${doiLink}
                    ${urlLink}
                </div>
            </article>
        `;
    }

    function formatType(type) {
        return type
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/^./, (char) => char.toUpperCase());
    }

    function stripHtml(value) {
        const temp = document.createElement("div");
        temp.innerHTML = value;
        return temp.textContent || temp.innerText || "";
    }

    function truncate(value, maxLength) {
        return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
}
