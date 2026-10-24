const modal = document.querySelector("#modal");
const form = document.querySelector("#transaction-form");
const list = document.querySelector("#transaction-list");

const setModal = (open) => {
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", String(!open));
  if (open) document.querySelector("#description").focus();
};

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "open-modal") setModal(true);
  if (action === "close-modal" || event.target === modal) setModal(false);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value.trim().replace(/[<>&"]/g, "");
  const amount = Number(document.querySelector("#amount").value);
  if (!description || !amount) return;

  const row = document.createElement("div");
  row.className = "transaction";
  row.innerHTML = `<span class="transaction-mark">−</span><span><b>${description}</b><small>Just now</small></span><strong>−£${amount.toFixed(2)}</strong>`;
  list.prepend(row);
  form.reset();
  setModal(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setModal(false);
});
