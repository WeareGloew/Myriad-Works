"use strict";

const menuButton = document.querySelector("#menuButton");
const mainNavigation = document.querySelector("#mainNavigation");
const openDialogButtons = document.querySelectorAll(".open-dialog");
const dialogs = document.querySelectorAll(".enquiry-dialog");
const enquiryForms = document.querySelectorAll(".enquiry-form");
const canvasStates = new Map();

/**
 * Mobile navigation
 */
function toggleNavigation() {
    const isOpen = mainNavigation.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
}

function closeNavigation() {
    mainNavigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
}

menuButton.addEventListener("click", toggleNavigation);

mainNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
});

/**
 * Dialog controls
 */
function openDialog(dialogId) {
    const dialog = document.getElementById(dialogId);

    if (!dialog) {
        return;
    }

    dialog.showModal();
    document.body.classList.add("dialog-open");
}

function closeDialog(dialog) {
    dialog.close();
    document.body.classList.remove("dialog-open");
}

openDialogButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openDialog(button.dataset.dialog);
    });
});

dialogs.forEach((dialog) => {
    const closeButton = dialog.querySelector(".close-dialog");

    closeButton.addEventListener("click", () => {
        closeDialog(dialog);
    });

    dialog.addEventListener("click", (event) => {
        const dialogRectangle = dialog.getBoundingClientRect();

        const clickedOutside =
            event.clientX < dialogRectangle.left ||
            event.clientX > dialogRectangle.right ||
            event.clientY < dialogRectangle.top ||
            event.clientY > dialogRectangle.bottom;

        if (clickedOutside) {
            closeDialog(dialog);
        }
    });

    dialog.addEventListener("close", () => {
        document.body.classList.remove("dialog-open");
    });
});

/**
 * Image previews
 */
function createImagePreview(file) {
    const item = document.createElement("div");
    const image = document.createElement("img");
    const fileName = document.createElement("p");
    const imageUrl = URL.createObjectURL(file);

    item.className = "preview-item";
    image.src = imageUrl;
    image.alt = `Preview of ${file.name}`;
    fileName.textContent = file.name;

    image.addEventListener(
        "load",
        () => {
            URL.revokeObjectURL(imageUrl);
        },
        { once: true }
    );

    item.append(image, fileName);

    return item;
}

document.querySelectorAll(".image-upload").forEach((input) => {
    input.addEventListener("change", () => {
        const uploadSection = input.closest(".upload-section");
        const previewContainer =
            uploadSection.querySelector(".image-preview");

        previewContainer.innerHTML = "";

        const files = Array.from(input.files || []);
        const maximumFiles = 4;
        const allowedFiles = files.slice(0, maximumFiles);

        allowedFiles.forEach((file) => {
            previewContainer.append(createImagePreview(file));
        });

        if (files.length > maximumFiles) {
            const warning = document.createElement("p");

            warning.textContent =
                `Only the first ${maximumFiles} images will be previewed.`;

            previewContainer.append(warning);
        }
    });
});

/**
 * Drawing canvases
 */
function getCanvasCoordinates(canvas, event) {
    const rectangle = canvas.getBoundingClientRect();

    return {
        x:
            (event.clientX - rectangle.left) *
            (canvas.width / rectangle.width),
        y:
            (event.clientY - rectangle.top) *
            (canvas.height / rectangle.height)
    };
}

function initialiseCanvas(canvas) {
    const context = canvas.getContext("2d");
    const drawingSection = canvas.closest(".drawing-section");
    const colourInput = drawingSection.querySelector(".pen-colour");

    const state = {
        isDrawing: false,
        isDirty: false,
        previousX: 0,
        previousY: 0,
        colourInput
    };

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 5;

    canvasStates.set(canvas.id, state);

    canvas.addEventListener("pointerdown", (event) => {
        event.preventDefault();

        const coordinates = getCanvasCoordinates(canvas, event);

        state.isDrawing = true;
        state.previousX = coordinates.x;
        state.previousY = coordinates.y;

        canvas.setPointerCapture(event.pointerId);

        context.beginPath();
        context.fillStyle = colourInput.value;
        context.arc(coordinates.x, coordinates.y, 2.5, 0, Math.PI * 2);
        context.fill();

        state.isDirty = true;
    });

    canvas.addEventListener("pointermove", (event) => {
        if (!state.isDrawing) {
            return;
        }

        event.preventDefault();

        const coordinates = getCanvasCoordinates(canvas, event);

        context.beginPath();
        context.moveTo(state.previousX, state.previousY);
        context.lineTo(coordinates.x, coordinates.y);
        context.strokeStyle = colourInput.value;
        context.stroke();

        state.previousX = coordinates.x;
        state.previousY = coordinates.y;
        state.isDirty = true;
    });

    const stopDrawing = (event) => {
        if (!state.isDrawing) {
            return;
        }

        state.isDrawing = false;

        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    };

    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointercancel", stopDrawing);
    canvas.addEventListener("pointerleave", (event) => {
        if (event.buttons === 0) {
            state.isDrawing = false;
        }
    });
}

document.querySelectorAll("canvas").forEach(initialiseCanvas);

document.querySelectorAll(".clear-canvas").forEach((button) => {
    button.addEventListener("click", () => {
        const canvas = document.getElementById(button.dataset.canvas);

        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");
        const state = canvasStates.get(canvas.id);

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (state) {
            state.isDirty = false;
        }
    });
});

/**
 * Convert a canvas drawing into a PNG file.
 */
function canvasToFile(canvas, fileName) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("The drawing could not be processed."));
                return;
            }

            resolve(
                new File(
                    [blob],
                    fileName,
                    { type: "image/png" }
                )
            );
        }, "image/png");
    });
}

/**
 * Display form feedback.
 */
function setFormStatus(statusElement, message, type = "") {
    statusElement.textContent = message;
    statusElement.classList.remove("success", "error");

    if (type) {
        statusElement.classList.add(type);
    }
}

/**
 * Submit enquiry forms.
 *
 * The form action must be replaced with a working form endpoint.
 */
async function submitEnquiryForm(form) {
    const submitButton = form.querySelector(".submit-button");
    const statusElement = form.querySelector(".form-status");
    const endpoint = form.action;
    const canvasId = form.dataset.drawingCanvas;
    const canvas = document.getElementById(canvasId);
    const canvasState = canvasStates.get(canvasId);

    if (
        !endpoint ||
        endpoint.includes("YOUR_FORM_ID")
    ) {
        setFormStatus(
            statusElement,
            "Please add your form endpoint before accepting enquiries.",
            "error"
        );

        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending enquiry...";

    setFormStatus(statusElement, "Sending your enquiry...");

    try {
        const formData = new FormData(form);

        if (canvas && canvasState?.isDirty) {
            const drawingFile = await canvasToFile(
                canvas,
                `${canvasId}-drawing.png`
            );

            formData.append("customer_drawing", drawingFile);
        }

        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                "The enquiry service did not accept the submission."
            );
        }

        setFormStatus(
            statusElement,
            "Thank you! Your enquiry has been sent successfully.",
            "success"
        );

        form.reset();

        const previewContainer = form.querySelector(".image-preview");

        if (previewContainer) {
            previewContainer.innerHTML = "";
        }

        if (canvas) {
            const context = canvas.getContext("2d");

            context.clearRect(0, 0, canvas.width, canvas.height);

            if (canvasState) {
                canvasState.isDirty = false;
            }
        }

        submitButton.textContent = "Enquiry sent";
    } catch (error) {
        console.error(error);

        setFormStatus(
            statusElement,
            "Your enquiry could not be sent. Please check your connection or contact me directly by email.",
            "error"
        );

        submitButton.disabled = false;
        submitButton.textContent =
            form.id === "websiteForm"
                ? "Send website enquiry"
                : "Send business-card enquiry";
    }
}

enquiryForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        await submitEnquiryForm(form);
    });
});

/**
 * Automatically update the footer year.
 */
document.querySelector("#currentYear").textContent =
    new Date().getFullYear();
