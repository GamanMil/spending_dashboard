const modal = document.querySelector("#modal");
const deleteModal = document.querySelector("#delete-modal");
const form = document.querySelector("#transaction-form");
const list = document.querySelector("#transaction-list");
const balanceForm = document.querySelector("#balance-form");
const balanceInput = document.querySelector("#balance-input");
const currentBalance = document.querySelector("#current-balance");
const balanceChange = document.querySelector("#balance-change");
const spentTotal = document.querySelector("#spent-total");
const monthlySpendingTotal = document.querySelector("#monthly-spending-total");
const monthlySpendingList = document.querySelector("#monthly-spending-list");
const typeFilter = document.querySelector("#type-filter");
const transactionSort = document.querySelector("#transaction-sort");
const typeInput = document.querySelector("#type");
const modalTitle = document.querySelector("#modal-title");
const modalSubmit = document.querySelector("#modal-submit");
const deleteMessage = document.querySelector("#delete-message");
const storageKey = "northstar-transactions";
const balanceStorageKey = "northstar-starting-balance";
const transactionTypes = ["Rent", "Shopping", "Subscription", "Food", "Transport", "Utilities", "Other"];
const typeColors = ["purple", "coral", "yellow", "green", "blue", "orange", "slate"];

const formatCurrency = (amount) => `£${amount.toFixed(2)}`;

const getTransactions = () => {
  try {
    const transactions = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(transactions)
      ? transactions.map((transaction, index) => ({
          ...transaction,
          id: transaction.id || `${transaction.createdAt || "legacy"}-${index}`,
          type: transactionTypes.includes(transaction.type) ? transaction.type : "Other",
        }))
      : [];
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

const addToStartingBalance = (amount) => {
  saveStartingBalance(getStartingBalance() + amount);
};

const saveStartingBalance = (amount) => {
  localStorage.setItem(balanceStorageKey, String(amount));
};

const createTransactionRow = ({ id, description, amount, createdAt, type = "Other" }) => {
  const row = document.createElement("div");
  row.className = "transaction";
  row.dataset.transactionId = id;
  const mark = document.createElement("span");
  mark.className = "transaction-mark";
  mark.textContent = "−";
  const details = document.createElement("span");
  const title = document.createElement("b");
  title.textContent = description;
  const date = document.createElement("small");
  date.textContent = `${type} · ${createdAt ? "Added locally" : "Just now"}`;
  details.append(title, date);
  const value = document.createElement("strong");
  value.textContent = `−${formatCurrency(amount)}`;
  const actions = document.createElement("span");
  actions.className = "transaction-actions";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "transaction-action";
  editButton.dataset.action = "edit-transaction";
  editButton.dataset.transactionId = id;
  editButton.textContent = "Edit";
  editButton.setAttribute("aria-label", `Edit ${description}`);
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "transaction-action delete";
  deleteButton.dataset.action = "delete-transaction";
  deleteButton.dataset.transactionId = id;
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${description}`);
  actions.append(editButton, deleteButton);
  row.append(mark, details, value, actions);
  return row;
};

const compareByDate = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

const getSortedTransactions = (transactions) => {
  const sort = transactionSort.value;
  return transactions.slice().sort((a, b) => {
    if (sort === "type") return a.type.localeCompare(b.type) || compareByDate(a, b);
    if (sort === "amount-high") return Number(b.amount) - Number(a.amount) || compareByDate(a, b);
    if (sort === "amount-low") return Number(a.amount) - Number(b.amount) || compareByDate(a, b);
    return compareByDate(a, b);
  });
};

const renderTransactions = () => {
  const selectedType = typeFilter.value;
  const transactions = getTransactions()
    .filter((transaction) => selectedType === "all" || transaction.type === selectedType);
  list.replaceChildren();
  getSortedTransactions(transactions).forEach((transaction) => list.append(createTransactionRow(transaction)));
};

const updateTypeFilter = (transactions) => {
  const selectedType = typeFilter.value;
  const types = [...new Set(transactions.map(({ type }) => type))].sort();
  typeFilter.replaceChildren(new Option("All types", "all"));
  types.forEach((type) => typeFilter.append(new Option(type, type)));
  typeFilter.value = types.includes(selectedType) ? selectedType : "all";
};

const isCurrentMonth = (createdAt) => {
  if (!createdAt) return false;
  const date = new Date(createdAt);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const renderMonthlySpending = (transactions) => {
  const monthlyTransactions = transactions.filter(({ createdAt }) => isCurrentMonth(createdAt));
  const totalsByType = monthlyTransactions.reduce((totals, transaction) => {
    totals[transaction.type] = (totals[transaction.type] || 0) + Number(transaction.amount || 0);
    return totals;
  }, {});
  const monthlySpent = Object.values(totalsByType).reduce((total, amount) => total + amount, 0);
  monthlySpendingTotal.textContent = formatCurrency(monthlySpent);
  const breakdown = document.querySelector(".spending-bar");
  const legend = document.querySelector(".legend");
  breakdown.replaceChildren();
  legend.replaceChildren();
  monthlySpendingList.replaceChildren();

  if (!monthlyTransactions.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "monthly-spending-empty";
    emptyState.textContent = "No spending recorded this month.";
    monthlySpendingList.append(emptyState);
    return monthlySpent;
  }

  Object.entries(totalsByType)
    .sort(([, amountA], [, amountB]) => amountB - amountA)
    .forEach(([type, amount], index) => {
      const segment = document.createElement("span");
      segment.className = typeColors[index % typeColors.length];
      segment.style.flex = `${amount / monthlySpent}`;
      breakdown.append(segment);

      const item = document.createElement("span");
      const marker = document.createElement("i");
      marker.className = typeColors[index % typeColors.length];
      const name = document.createElement("em");
      name.textContent = type;
      const total = document.createElement("b");
      total.textContent = formatCurrency(amount);
      item.append(marker, name, total);
      legend.append(item);
    });

  monthlyTransactions
    .slice()
    .sort(compareByDate)
    .forEach((transaction) => monthlySpendingList.append(createTransactionRow(transaction)));
  return monthlySpent;
};

const renderSummary = () => {
  const transactions = getTransactions();
  const spent = transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  const monthlySpent = renderMonthlySpending(transactions);
  const startingBalance = getStartingBalance();
  const balance = startingBalance - spent;
  currentBalance.textContent = formatCurrency(balance);
  spentTotal.textContent = formatCurrency(monthlySpent);
  balanceChange.textContent = monthlySpent
    ? `${formatCurrency(monthlySpent)} spent this month.`
    : "No spending recorded this month.";
  balanceInput.value = startingBalance ? startingBalance.toFixed(2) : "";
  updateTypeFilter(transactions);
  renderTransactions();
};

renderSummary();

let editingTransactionId = null;
let pendingDeleteId = null;

const setModal = (open, transaction = null) => {
  modal.classList.toggle("open", open);
  modal.setAttribute("aria-hidden", String(!open));
  if (open) {
    editingTransactionId = transaction?.id || null;
    modalTitle.textContent = transaction ? "Edit transaction" : "Add a transaction";
    modalSubmit.textContent = transaction ? "Save changes" : "Save transaction";
    document.querySelector("#description").value = transaction?.description || "";
    document.querySelector("#amount").value = transaction?.amount ?? "";
    typeInput.value = transaction?.type || "Other";
    document.querySelector("#description").focus();
  } else {
    editingTransactionId = null;
    form.reset();
  }
};

const setDeleteModal = (open, transaction = null) => {
  deleteModal.classList.toggle("open", open);
  deleteModal.setAttribute("aria-hidden", String(!open));
  pendingDeleteId = open ? transaction?.id || null : null;
  if (open) {
    deleteMessage.textContent = `This will permanently remove "${transaction.description}" from your dashboard.`;
    deleteModal.querySelector("[data-action='confirm-delete']").focus();
  }
};

document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  const action = actionElement?.dataset.action;
  if (action === "open-modal") setModal(true);
  if (action === "close-modal" || event.target === modal) setModal(false);
  if (action === "close-delete-modal" || event.target === deleteModal) setDeleteModal(false);
  if (action === "edit-transaction") {
    const transaction = getTransactions().find(({ id }) => id === actionElement.dataset.transactionId);
    if (transaction) setModal(true, transaction);
  }
  if (action === "delete-transaction") {
    const transactionId = actionElement.dataset.transactionId;
    const transactions = getTransactions();
    const transaction = transactions.find(({ id }) => id === transactionId);
    if (!transaction) return;
    setDeleteModal(true, transaction);
  }
  if (action === "confirm-delete" && pendingDeleteId) {
    const transactions = getTransactions();
    saveTransactions(transactions.filter(({ id }) => id !== pendingDeleteId));
    renderSummary();
    setDeleteModal(false);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value.trim().replace(/[<>&"]/g, "");
  const amount = Number(document.querySelector("#amount").value);
  if (!description || !amount) return;

  const transactions = getTransactions();
  const transaction = {
    id: editingTransactionId || crypto.randomUUID(),
    description,
    amount,
    type: typeInput.value,
    createdAt: editingTransactionId
      ? transactions.find(({ id }) => id === editingTransactionId)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };
  const transactionIndex = transactions.findIndex(({ id }) => id === editingTransactionId);
  if (transactionIndex >= 0) transactions[transactionIndex] = transaction;
  else transactions.push(transaction);
  saveTransactions(transactions);
  renderSummary();
  setModal(false);
});

balanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(balanceInput.value);
  if (!Number.isFinite(amount) || amount < 0) return;

  addToStartingBalance(amount);
  renderSummary();
  balanceInput.value = "";
});

typeFilter.addEventListener("change", renderTransactions);
transactionSort.addEventListener("change", renderTransactions);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setModal(false);
    setDeleteModal(false);
  }
});
