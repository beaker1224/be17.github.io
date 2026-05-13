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
