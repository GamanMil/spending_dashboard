const modal = document.querySelector("#modal");
const form = document.querySelector("#transaction-form");
const list = document.querySelector("#transaction-list");
const storageKey = "northstar-transactions";

const getTransactions = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
};

const saveTransactions = (transactions) => {
  localStorage.setItem(storageKey, JSON.stringify(transactions));
};

const renderTransaction = ({ description, amount, createdAt }) => {
  const row = document.createElement("div");
  row.className = "transaction";
  row.innerHTML = `<span class="transaction-mark">−</span><span><b>${description}</b><small>${createdAt ? "Added locally" : "Just now"}</small></span><strong>−£${amount.toFixed(2)}</strong>`;
  list.prepend(row);
};

getTransactions().reverse().forEach(renderTransaction);

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

  const transactions = getTransactions();
  const transaction = { description, amount, createdAt: new Date().toISOString() };
  transactions.push(transaction);
  saveTransactions(transactions);
  renderTransaction(transaction);
  form.reset();
  setModal(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setModal(false);
});
