const modal = document.querySelector("#modal");
const form = document.querySelector("#transaction-form");
const list = document.querySelector("#transaction-list");
const balanceForm = document.querySelector("#balance-form");
const balanceInput = document.querySelector("#balance-input");
const currentBalance = document.querySelector("#current-balance");
const balanceChange = document.querySelector("#balance-change");
const spentTotal = document.querySelector("#spent-total");
const storageKey = "northstar-transactions";
const balanceStorageKey = "northstar-starting-balance";

const formatCurrency = (amount) => `£${amount.toFixed(2)}`;

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

const getStartingBalance = () => {
  const storedBalance = Number(localStorage.getItem(balanceStorageKey));
  return Number.isFinite(storedBalance) && storedBalance >= 0 ? storedBalance : 0;
};

const saveStartingBalance = (amount) => {
  localStorage.setItem(balanceStorageKey, String(amount));
};

const renderTransaction = ({ description, amount, createdAt }) => {
  const row = document.createElement("div");
  row.className = "transaction";
  const mark = document.createElement("span");
  mark.className = "transaction-mark";
  mark.textContent = "−";
  const details = document.createElement("span");
  const title = document.createElement("b");
  title.textContent = description;
  const date = document.createElement("small");
  date.textContent = createdAt ? "Added locally" : "Just now";
  details.append(title, date);
  const value = document.createElement("strong");
  value.textContent = `−${formatCurrency(amount)}`;
  row.append(mark, details, value);
  list.prepend(row);
};

const renderSummary = () => {
  const transactions = getTransactions();
  const spent = transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const startingBalance = getStartingBalance();
  const balance = startingBalance - spent;
  currentBalance.textContent = formatCurrency(balance);
  spentTotal.textContent = formatCurrency(spent);
  balanceChange.textContent = spent
    ? `${formatCurrency(spent)} spent since your starting balance.`
    : "No transactions recorded yet.";
  balanceInput.value = startingBalance ? startingBalance.toFixed(2) : "";
};

getTransactions().reverse().forEach(renderTransaction);
renderSummary();

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
  renderSummary();
  form.reset();
  setModal(false);
});

balanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(balanceInput.value);
  if (!Number.isFinite(amount) || amount < 0) return;

  saveStartingBalance(amount);
  renderSummary();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setModal(false);
});
