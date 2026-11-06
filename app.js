"use strict";

// 3 sections × 4 rows × 12 seats = 144 seats
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

const seats = [];
let inspectedSeatId = null;

const sectionsContainer = document.getElementById("seating-sections");
const detailsContainer = document.getElementById("seat-details");
const addButton = document.getElementById("add-to-cart");
const statusMessage = document.getElementById("status-message");

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

      const rowLabel = document.createElement("span");
      rowLabel.className = "row-label";
      rowLabel.textContent = row;
      rowElement.appendChild(rowLabel);

      const rowSeats = seats.filter(function (seat) {
        return seat.row === row;
      });

      rowSeats.forEach(function (seat) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "seat";
        button.textContent = seat.number;
        button.dataset.seatId = seat.id;

        const state = seat.unavailable ? "Unavailable" : "Available";

        button.setAttribute(
          "aria-label",
          `${seat.section}, row ${seat.row}, seat ${seat.number}, ` +
          `${seat.price} AZN, ${state}`
        );

        button.setAttribute("aria-pressed", "false");

        if (seat.unavailable) {
          button.classList.add("unavailable");
        }

        rowElement.appendChild(button);
      });

      sectionElement.appendChild(rowElement);
    });

    sectionsContainer.appendChild(sectionElement);
  });
}

function inspectSeat(id) {
  const seat = seats.find(function (item) {
    return item.id === id;
  });

  if (!seat) {
    return;
  }

  inspectedSeatId = seat.id;

  detailsContainer.innerHTML = `
    <p><strong>Section:</strong> ${seat.section}</p>
    <p><strong>Row:</strong> ${seat.row}</p>
    <p><strong>Seat:</strong> ${seat.number}</p>
    <p><strong>Price:</strong> ${seat.price} AZN</p>
    <p><strong>Status:</strong>
      ${seat.unavailable ? "Unavailable" : "Available"}
    </p>
  `;

  // Cart functionality will be added in the next stage.
  addButton.disabled = true;

  statusMessage.textContent = seat.unavailable
    ? "This seat is unavailable and cannot be added."
    : "Seat inspected. Cart functionality will be added next.";

  sectionsContainer.querySelectorAll(".seat").forEach(function (button) {
    const isInspected = button.dataset.seatId === inspectedSeatId;

    button.classList.toggle(
      "inspected",
      isInspected && !seat.unavailable
    );

    button.setAttribute("aria-pressed", String(isInspected));
  });
}

sectionsContainer.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-seat-id]");

  if (button) {
    inspectSeat(button.dataset.seatId);
  }
});

createSeatData();
renderVenue();