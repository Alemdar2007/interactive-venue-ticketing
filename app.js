"use strict";

// Venue data: 144 seats across three price categories.
const venue = [
  {
    name: "VIP",
    price: 50,
    rows: ["A", "B", "C", "D"],
    seatsPerRow: 12
  },
  {
    name: "Standard",
    price: 30,
    rows: ["E", "F", "G", "H"],
    seatsPerRow: 12
  },
  {
    name: "Economy",
    price: 15,
    rows: ["I", "J", "K", "L"],
    seatsPerRow: 12
  }
];

const unavailableSeats = new Set([
  "A-3", "B-8", "D-11",
  "E-5", "G-9", "H-2",
  "I-7", "K-4", "L-10"
]);

const storageKey = "theatre-ticket-cart";
const seats = [];
let cart = [];
let inspectedSeatId = null;

const sectionsContainer = document.getElementById("seating-sections");
const detailsContainer = document.getElementById("seat-details");
const addButton = document.getElementById("add-to-cart");
const statusMessage = document.getElementById("status-message");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const emptyCart = document.getElementById("empty-cart");

function createSeatData() {
  venue.forEach(function (section) {
    section.rows.forEach(function (row) {
      for (let number = 1; number <= section.seatsPerRow; number++) {
        const id = `${row}-${number}`;

        seats.push({
          id: id,
          section: section.name,
          row: row,
          number: number,
          price: section.price,
          unavailable: unavailableSeats.has(id)
        });
      }
    });
  });
}

function findSeat(id) {
  return seats.find(function (seat) {
    return seat.id === id;
  });
}

function getSeatStatus(seat) {
  if (seat.unavailable) return "Unavailable";
  if (cart.includes(seat.id)) return "In Cart";
  return "Available";
}

function restoreCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));

    if (Array.isArray(saved)) {
      cart = [...new Set(saved)].filter(function (id) {
        const seat = findSeat(id);
        return seat && !seat.unavailable;
      });
    }
  } catch {
    cart = [];
    statusMessage.textContent =
      "Saved cart could not be restored. Starting with an empty cart.";
  }
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch {
    statusMessage.textContent =
      "Cart updated, but browser storage is unavailable. " +
      "Tickets may not remain after refresh.";
  }
}

function renderVenue() {
  sectionsContainer.replaceChildren();

  venue.forEach(function (section) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "venue-section";

    const heading = document.createElement("h3");
    heading.textContent = `${section.name} — ${section.price} AZN`;
    sectionElement.appendChild(heading);

    section.rows.forEach(function (row) {
      const rowElement = document.createElement("div");
      rowElement.className = "seat-row";

      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = row;
      rowElement.appendChild(label);

      seats.filter(function (seat) {
        return seat.row === row;
      }).forEach(function (seat) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "seat";
        button.textContent = seat.number;
        button.dataset.seatId = seat.id;
        rowElement.appendChild(button);
      });

      sectionElement.appendChild(rowElement);
    });

    sectionsContainer.appendChild(sectionElement);
  });

  updateSeatStates();
}

function updateSeatStates() {
  sectionsContainer.querySelectorAll(".seat").forEach(function (button) {
    const seat = findSeat(button.dataset.seatId);
    const inCart = cart.includes(seat.id);
    const inspected = seat.id === inspectedSeatId;

    button.classList.toggle("unavailable", seat.unavailable);
    button.classList.toggle("in-cart", inCart);
    button.classList.toggle(
      "inspected",
      inspected && !seat.unavailable && !inCart
    );

    button.setAttribute("aria-pressed", String(inspected));
    button.setAttribute(
      "aria-label",
      `${seat.section}, row ${seat.row}, seat ${seat.number}, ` +
      `${seat.price} AZN, ${getSeatStatus(seat)}`
    );
  });
}

function renderDetails() {
  const seat = findSeat(inspectedSeatId);

  if (!seat) {
    detailsContainer.textContent =
      "Click a seat to see its details and price.";
    addButton.disabled = true;
    return;
  }

  detailsContainer.innerHTML = `
    <p><strong>Section:</strong> ${seat.section}</p>
    <p><strong>Row:</strong> ${seat.row}</p>
    <p><strong>Seat:</strong> ${seat.number}</p>
    <p><strong>Price:</strong> ${seat.price} AZN</p>
    <p><strong>Status:</strong> ${getSeatStatus(seat)}</p>
  `;

  addButton.disabled = seat.unavailable || cart.includes(seat.id);
}

function inspectSeat(id) {
  const seat = findSeat(id);
  if (!seat) return;

  inspectedSeatId = id;
  renderDetails();
  updateSeatStates();

  if (seat.unavailable) {
    statusMessage.textContent = "This seat is unavailable.";
  } else if (cart.includes(id)) {
    statusMessage.textContent = "This seat is already in your cart.";
  } else {
    statusMessage.textContent =
      "Press ADD TO CART to add this ticket.";
  }
}

function renderCart() {
  cartItems.replaceChildren();
  let total = 0;

  cart.forEach(function (id) {
    const seat = findSeat(id);
    total += seat.price;

    const item = document.createElement("li");
    item.className = "cart-item";

    const text = document.createElement("span");
    text.textContent =
      `${seat.section} · ${seat.row}${seat.number} · ${seat.price} AZN`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.dataset.removeId = id;
    removeButton.setAttribute(
      "aria-label",
      `Remove seat ${seat.row}${seat.number} from cart`
    );

    item.append(text, removeButton);
    cartItems.appendChild(item);
  });

  cartTotal.textContent = total;
  cartCount.textContent = cart.length;
  emptyCart.hidden = cart.length > 0;
}

function updateInterface() {
  updateSeatStates();
  renderDetails();
  renderCart();
}

function addToCart() {
  const seat = findSeat(inspectedSeatId);

  if (!seat || seat.unavailable || cart.includes(seat.id)) {
    return;
  }

  cart.push(seat.id);
  updateInterface();

  statusMessage.textContent =
    `Seat ${seat.row}${seat.number} added to your cart.`;

  saveCart();
}

function removeFromCart(id) {
  const removedIndex = cart.indexOf(id);
  if (removedIndex === -1) return;

  cart.splice(removedIndex, 1);

  updateInterface();
  statusMessage.textContent = `Seat ${id} removed from your cart.`;
  saveCart();

  // Keep keyboard focus on a visible control after removal.
  const remainingButtons = cartItems.querySelectorAll("button[data-remove-id]");
  const nextRemoveButton =
    remainingButtons[Math.min(removedIndex, remainingButtons.length - 1)];
  if (nextRemoveButton) {
    nextRemoveButton.focus();
  } else {
    const seatButton = sectionsContainer.querySelector(
      `[data-seat-id="${id}"]`
    );
    if (seatButton) seatButton.focus({ preventScroll: true });
  }
}

sectionsContainer.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-seat-id]");
  if (button) inspectSeat(button.dataset.seatId);
});

addButton.addEventListener("click", addToCart);

cartItems.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-remove-id]");
  if (button) removeFromCart(button.dataset.removeId);
});

createSeatData();
restoreCart();
renderVenue();
renderDetails();
renderCart();
// Map navigation
const mapViewport = document.getElementById("map-viewport");
const venueMap = document.getElementById("venue-map");

let mapScale = 1;
let mapX = 0;
let mapY = 0;
let minimumScale = 0.2;

mapViewport.style.position = "relative";
mapViewport.style.overflow = "hidden";

venueMap.style.position = "absolute";
venueMap.style.left = "0";
venueMap.style.top = "0";
venueMap.style.margin = "0";
venueMap.style.transformOrigin = "top left";

function limitValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function applyMapView() {
  const viewportWidth = mapViewport.clientWidth;
  const viewportHeight = mapViewport.clientHeight;
  const scaledWidth = venueMap.offsetWidth * mapScale;
  const scaledHeight = venueMap.offsetHeight * mapScale;

  const minimumX = Math.min(0, viewportWidth - scaledWidth) - 60;
  const maximumX = Math.max(0, viewportWidth - scaledWidth) + 60;
  const minimumY = Math.min(0, viewportHeight - scaledHeight) - 60;
  const maximumY = Math.max(0, viewportHeight - scaledHeight) + 60;

  mapX = limitValue(mapX, minimumX, maximumX);
  mapY = limitValue(mapY, minimumY, maximumY);

  venueMap.style.transform =
    `translate(${mapX}px, ${mapY}px) scale(${mapScale})`;

  document.getElementById("zoom-in").disabled = mapScale >= 2.5;
  document.getElementById("zoom-out").disabled =
    mapScale <= minimumScale + 0.001;
}

function resetMapView() {
  const availableWidth = Math.max(1, mapViewport.clientWidth - 24);
  const availableHeight = Math.max(1, mapViewport.clientHeight - 24);

  const fittedScale = Math.min(
    availableWidth / venueMap.offsetWidth,
    availableHeight / venueMap.offsetHeight,
    1
  );

  minimumScale = Math.min(0.4, fittedScale);
  mapScale = fittedScale;

  mapX = (
    mapViewport.clientWidth - venueMap.offsetWidth * mapScale
  ) / 2;

  mapY = (
    mapViewport.clientHeight - venueMap.offsetHeight * mapScale
  ) / 2;

  applyMapView();
}

function zoomMap(
  multiplier,
  anchorX = mapViewport.clientWidth / 2,
  anchorY = mapViewport.clientHeight / 2
) {
  const previousScale = mapScale;
  const nextScale = limitValue(
    previousScale * multiplier,
    minimumScale,
    2.5
  );

  const scaleRatio = nextScale / previousScale;
  mapX = anchorX - (anchorX - mapX) * scaleRatio;
  mapY = anchorY - (anchorY - mapY) * scaleRatio;

  mapScale = nextScale;
  applyMapView();
}

function moveMap(horizontal, vertical) {
  mapX += horizontal;
  mapY += vertical;
  applyMapView();
}

document.getElementById("zoom-in").addEventListener(
  "click",
  function () {
    zoomMap(1.2);
  }
);

document.getElementById("zoom-out").addEventListener(
  "click",
  function () {
    zoomMap(1 / 1.2);
  }
);

document.getElementById("move-up").addEventListener(
  "click",
  function () {
    moveMap(0, -60);
  }
);

document.getElementById("move-down").addEventListener(
  "click",
  function () {
    moveMap(0, 60);
  }
);

document.getElementById("move-left").addEventListener(
  "click",
  function () {
    moveMap(-60, 0);
  }
);

document.getElementById("move-right").addEventListener(
  "click",
  function () {
    moveMap(60, 0);
  }
);

document.getElementById("reset-view").addEventListener(
  "click",
  resetMapView
);

const mapResizeObserver = new ResizeObserver(resetMapView);
mapResizeObserver.observe(mapViewport);

resetMapView();
// Bonus: mouse-wheel zoom and drag to pan.
mapViewport.style.cursor = "grab";
mapViewport.style.userSelect = "none";

mapViewport.addEventListener("wheel", function (event) {
  if (event.ctrlKey || event.deltaY === 0) return;

  const zoomingIn = event.deltaY < 0;
  if ((zoomingIn && mapScale >= 2.5) ||
      (!zoomingIn && mapScale <= minimumScale)) return;

  event.preventDefault();
  const bounds = mapViewport.getBoundingClientRect();
  zoomMap(
    zoomingIn ? 1.1 : 1 / 1.1,
    event.clientX - bounds.left - mapViewport.clientLeft,
    event.clientY - bounds.top - mapViewport.clientTop
  );
}, { passive: false });

let mapDrag = null;
let skipDragClick = false;

mapViewport.addEventListener("pointerdown", function (event) {
  if (event.pointerType !== "mouse" || event.button !== 0) return;

  skipDragClick = false;
  mapDrag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false
  };
});

window.addEventListener("pointermove", function (event) {
  if (!mapDrag || event.pointerId !== mapDrag.id) return;

  const dx = event.clientX - mapDrag.x;
  const dy = event.clientY - mapDrag.y;

  // Small mouse movements still count as a normal seat click.
  if (!mapDrag.moved && Math.hypot(dx, dy) < 5) return;

  if (!mapDrag.moved) {
    mapDrag.moved = true;
    mapViewport.setPointerCapture(event.pointerId);
    mapViewport.style.cursor = "grabbing";
  }

  moveMap(dx, dy);
  mapDrag.x = event.clientX;
  mapDrag.y = event.clientY;
});

function finishMapDrag(event) {
  if (!mapDrag || event.pointerId !== mapDrag.id) return;

  skipDragClick = event.type === "pointerup" && mapDrag.moved;
  mapDrag = null;
  mapViewport.style.cursor = "grab";
}

window.addEventListener("pointerup", finishMapDrag);
window.addEventListener("pointercancel", finishMapDrag);

mapViewport.addEventListener("click", function (event) {
  if (!skipDragClick || event.detail === 0) return;

  skipDragClick = false;
  event.stopPropagation();
}, true);