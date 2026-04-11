const generatedDecors = [];
let zIndexCounter = 1000;

document.querySelectorAll(".window").forEach((win) => {
  dragElement(win);
  forwardDecor(win);
});

async function getDecor() {
  const requestURL = "decor.json";
  const request = new Request(requestURL);
  const response = await fetch(request);
  const decor = await response.json();
  return decor;
}

function insertNavButtons(elem, decor) {
  const cont = elem.querySelector(".nav-buttons");

  for (const button of decor.nav_button_svgs) {
    cont.insertAdjacentHTML("beforeend", button.html_tag);
  }
}

function insertInitialNavButtons(decor) {
  document.querySelectorAll(".window").forEach((mainWindow) => {
    insertNavButtons(mainWindow, decor);
  });
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function forwardDecor(decor) {
  let lastInteractionTime = 0;
  const DOUBLE_TAP_DELAY = 300;

  decor.addEventListener("pointerdown", function (e) {
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - lastInteractionTime;

    if (timeDifference < DOUBLE_TAP_DELAY && timeDifference > 0) {
      e.preventDefault();
      decor.style.zIndex = ++zIndexCounter;

      lastInteractionTime = 0;
    } else {
      lastInteractionTime = currentTime;
    }
  });
}

function dragElement(decor) {
  let startX = 0,
    startY = 0;
  let initialTop = 0,
    initialLeft = 0;
  let maxTop = 0,
    maxLeft = 0;

  decor.style.touchAction = "none";

  const handle = decor.querySelector(".navbar") || decor;

  handle.addEventListener("pointerdown", dragPointerDown);

  function dragPointerDown(e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    e.preventDefault();

    handle.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;
    initialTop = decor.offsetTop;
    initialLeft = decor.offsetLeft;

    maxLeft = decor.parentElement.offsetWidth - decor.offsetWidth - 20;
    maxTop = decor.parentElement.offsetHeight - decor.offsetHeight - 20;

    handle.addEventListener("pointermove", elementDrag);
    handle.addEventListener("pointerup", closeDragElement);
    handle.addEventListener("pointercancel", closeDragElement);
  }

  function elementDrag(e) {
    e.preventDefault();

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newTop = Math.max(0, Math.min(maxTop, initialTop + deltaY));
    const newLeft = Math.max(0, Math.min(maxLeft, initialLeft + deltaX));

    decor.style.top = newTop + "px";
    decor.style.left = newLeft + "px";
  }

  function closeDragElement(e) {
    handle.releasePointerCapture(e.pointerId);
    handle.removeEventListener("pointermove", elementDrag);
    handle.removeEventListener("pointerup", closeDragElement);
    handle.removeEventListener("pointercancel", closeDragElement);
  }
}

function generateDecors(decor) {
  for (decorCont of document.querySelectorAll(".decorated")) {
    const decorCount = decor.count.window + decor.count.sticker;

    for (let i = 0; i < decorCount; i++) {
      let decorType = i < decor.count.window ? "window" : "sticker";

      if (decorType === "window") {
        decorType = getRandomInt(0, 1) === 0 ? "message" : "picture";
      }

      if (decorCont.dataset.decorPrio) {
        decorType = decorCont.dataset.decorPrio;
      }

      const decorSizeBasisX =
        decorType === "sticker" ? decor.sticker_X : decor.window_X;
      const decorSizeBasisY =
        decorType === "sticker" ? decor.sticker_y : decor.window_y;
      const decorSizeX = getRandomInt(decorSizeBasisX.min, decorSizeBasisX.max);
      const decorSizeY = getRandomInt(decorSizeBasisY.min, decorSizeBasisY.max);

      if (decorType === "message" || decorType === "picture") {
        const decorColor =
          decor.window_colors[getRandomInt(0, decor.window_colors.length - 1)];

        const decorWindow = document.createElement("div");
        decorWindow.classList.add("window");
        decorWindow.style.setProperty("--color", `var(--${decorColor})`);
        decorWindow.style.width = `${decorSizeX}vw`;
        decorWindow.style.height = `${decorSizeY}vh`;

        const navbar = document.createElement("section");
        navbar.classList.add("navbar");
        const title = document.createElement("h2");
        title.textContent = `${decorType}${i}.exe`;
        const buttonsCont = document.createElement("div");
        buttonsCont.classList.add("nav-buttons");
        navbar.appendChild(buttonsCont);

        const content = document.createElement("section");
        content.classList.add("content");

        let toBeContent;
        if (decorType === "message") {
          toBeContent = document.createElement("p");
          toBeContent.textContent =
            decor.messages[getRandomInt(0, decor.messages.length - 1)];
          content.appendChild(toBeContent);
        } else {
          toBeContent = document.createElement("img");
          toBeContent.src =
            decor.pictures[getRandomInt(0, decor.pictures.length - 1)];
          toBeContent.alt = "decor image";
          content.appendChild(toBeContent);
        }

        const frag = document.createDocumentFragment();
        frag.appendChild(decorWindow);
        navbar.appendChild(title);
        navbar.appendChild(buttonsCont);
        decorWindow.appendChild(navbar);
        decorWindow.appendChild(content);
        decorCont.appendChild(frag);
        generatedDecors.push(decorWindow);

        insertNavButtons(decorWindow, decor);

        dragElement(decorWindow);
        forwardDecor(decorWindow);
      } else {
        const sticker = document.createElement("div");
        sticker.classList.add("sticker");
        sticker.style.width = `${decorSizeX}vw`;
        sticker.style.height = `fit-content`;

        sticker.insertAdjacentHTML(
          "beforeend",
          decor.sticker_svgs[getRandomInt(0, decor.sticker_svgs.length - 1)]
            .html_tag,
        );

        sticker.style.zIndex = 0;
        sticker.style.transform = `rotate(0.${getRandomInt(decor.sticker_rotation.min, decor.sticker_rotation.max)}turn)`;
        decorCont.appendChild(sticker);
        generatedDecors.push(sticker);

        dragElement(sticker);
        forwardDecor(sticker);
      }
    }
  }
}

function repositionDecors() {
  const edgePadding = 20;
  const maxOverlapRatio = 0.5;
  const placedRects = [];

  document.querySelectorAll(".window.main").forEach((mainWindow) => {
    placedRects.push({
      x1: mainWindow.offsetLeft,
      y1: mainWindow.offsetTop,
      x2: mainWindow.offsetLeft + mainWindow.offsetWidth,
      y2: mainWindow.offsetTop + mainWindow.offsetHeight,
    });
  });

  document.querySelectorAll(".window.picture").forEach((pictureWindow) => {
    placedRects.push({
      x1: pictureWindow.offsetLeft,
      y1: pictureWindow.offsetTop,
      x2: pictureWindow.offsetLeft + pictureWindow.offsetWidth,
      y2: pictureWindow.offsetTop + pictureWindow.offsetHeight,
    });
  });

  generatedDecors.forEach((decor) => {
    const width = decor.offsetWidth;
    const height = decor.offsetHeight;
    const area = width * height;

    let foundPosition = false;
    let decorX, decorY;

    // We use a limited-iteration heuristic to avoid infinite loops
    // while targeting the "Area Constraint"
    for (let attempts = 0; attempts < 20; attempts++) {
      decorX = Math.max(
        edgePadding,
        getRandomInt(0, window.innerWidth - width - edgePadding),
      );
      decorY = Math.max(
        edgePadding,
        getRandomInt(0, window.innerHeight - height - edgePadding),
      );

      const currentRect = {
        x1: decorX,
        y1: decorY,
        x2: decorX + width,
        y2: decorY + height,
      };

      // Check overlap against all previously placed items
      let totalOverlapArea = 0;
      for (const other of placedRects) {
        totalOverlapArea += calculateOverlapArea(currentRect, other);
      }

      // Condition: Overlap must be <= 30% of current decor's area
      if (totalOverlapArea / area <= maxOverlapRatio) {
        foundPosition = true;
        break;
      }
    }

    // Apply the position (even if heuristic didn't find perfect, it found the best available)
    decor.style.left = `${decorX}px`;
    decor.style.top = `${decorY}px`;

    placedRects.push({
      x1: decorX,
      y1: decorY,
      x2: decorX + width,
      y2: decorY + height,
    });
  });
}

/**
 * Helper to calculate the intersection area of two rectangles
 */
function calculateOverlapArea(rect1, rect2) {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x2, rect2.x2) - Math.max(rect1.x1, rect2.x1),
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.y2, rect2.y2) - Math.max(rect1.y1, rect2.y1),
  );
  return xOverlap * yOverlap;
}

let resizeTimer;
let lastWidth = window.innerWidth;

function resetDecors(decor) {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    generatedDecors.forEach((win) => win.remove());
    generatedDecors.length = 0;
    generateDecors(decor);
    repositionDecors();
  }, 250);
}

const decorJSON = getDecor().then((decor) => {
  insertInitialNavButtons(decor);
  generateDecors(decor);
  repositionDecors();
  window.addEventListener("resize", (e) => {
    if (window.innerWidth !== lastWidth) {
      lastWidth = window.innerWidth;
      resetDecors(decor);
    }
  });
});
