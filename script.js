const goBtn = document.getElementById("goBtn");
const btnText = document.getElementById("btnText");
const subsInput = document.getElementById("subs");
const errorDiv = document.getElementById("error");
const summaryScreen = document.getElementById("summaryScreen");
const tableScreen = document.getElementById("tableScreen");
const nextBtn = document.getElementById("nextBtn");

let currentData = null;

goBtn.onclick = async () => {
  const subs = subsInput.value.trim();
  
  // Validation
  if (!subs) {
    showError("Please enter your subscriptions");
    return;
  }

  // Loading state
  goBtn.disabled = true;
  btnText.innerHTML = 'Analyzing<span class="loading"></span>';
  errorDiv.style.display = "none";
  summaryScreen.style.display = "none";
  tableScreen.style.display = "none";

  try {
    const res = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptions: subs })
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();

    // Validate response structure
    if (!data.summary || !data.table) {
      throw new Error("Invalid response format");
    }

    currentData = data;

    // Display summary
    document.getElementById("recCount").textContent = 
      data.summary.recommendation_count || 0;
    document.getElementById("totalSavings").textContent = 
      `$${(data.summary.total_savings || 0).toFixed(2)}`;

    summaryScreen.style.display = "block";

  } catch (error) {
    showError(`Error: ${error.message}. Please try again.`);
    console.error(error);
  } finally {
    goBtn.disabled = false;
    btnText.textContent = "Analyze Subscriptions";
  }
};

nextBtn.onclick = () => {
  if (!currentData) return;
  
  const rows = currentData.table.map(r => `
    <tr>
      <td>${r.Category || 'N/A'}</td>
      <td>${r["Current Subscription & Price"] || 'N/A'}</td>
      <td>${r["Applicable Bundle / Perk / Credit"] || 'N/A'}</td>
      <td><strong>$${(r["Estimated Savings"] || 0).toFixed(2)}</strong></td>
    </tr>
  `).join("");

  const total = (currentData.total_row?.["Total Estimated Savings"] || 0).toFixed(2);

  tableScreen.innerHTML = `
    <h2>💡 Optimization Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Current Subscription</th>
          <th>Recommendation</th>
          <th>Savings</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="3">Total Estimated Savings</td>
          <td><strong>$${total}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
  
  tableScreen.style.display = "block";
  tableScreen.scrollIntoView({ behavior: 'smooth' });
};

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}
