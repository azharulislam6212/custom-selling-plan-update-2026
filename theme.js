
class PurchaseOptions extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {

    this.radios = this.querySelectorAll(".purchase-option");
    this.select = this.querySelector("#selling-plan-select");
    this.cards = this.querySelectorAll(".purchase-card");

    this.planData = JSON.parse(
      document.getElementById("selling-plans-data").textContent
    );

    this.radios.forEach(radio => {
      radio.addEventListener("change", () => this.updatePurchaseOption());
    });

    if (this.select) {

      this.select.addEventListener("change", () => {
        this.updateSellingPlan();
      });

    }

    // Start observer
    this.observeSellingPlanInput();

    // Initial UI
    this.updateSellingPlan();
    this.updatePurchaseOption();

  }

  observeSellingPlanInput() {

    if (this.observer) return;

    this.observer = new MutationObserver(() => {

      const hiddenInput = this.getSellingPlanInput();

      if (!hiddenInput) return;

      this.updateHiddenInput();

    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial attempt
    this.updateHiddenInput();

  }

  updateHiddenInput() {

    const hiddenInput = this.getSellingPlanInput();

    if (!hiddenInput) return;

    const checked = this.querySelector(".purchase-option:checked");

    hiddenInput.value =
      checked && checked.value !== ""
        ? this.select?.value || checked.value
        : "";

    hiddenInput.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );

  }

  getSellingPlanInput() {

    // 1. যদি component form-এর ভিতরে থাকে
    let form = this.closest("form");

    if (form) {
      return form.querySelector('input[name="selling_plan"]');
    }

    // 2. একই product section-এর product-form খুঁজুন
    const section = this.closest(".shopify-section");

    if (section) {
      form = section.querySelector("product-form form");

      if (form) {
        return form.querySelector('input[name="selling_plan"]');
      }
    }

    // 3. Fallback (শেষ চেষ্টা)
    form = document.querySelector("product-form form");

    return form?.querySelector('input[name="selling_plan"]');
  }

  updateSellingPlan() {

    const hiddenInput = this.getSellingPlanInput();

    if (!this.select) return;


    // Auto select subscription
    const subscriptionRadio = this.querySelector(
      '.purchase-card.subscribe .purchase-option'
    );

    if (subscriptionRadio) {
      subscriptionRadio.checked = true;
    }

    this.cards.forEach(card => card.classList.remove("active"));
    this.querySelector(".purchase-card.subscribe")?.classList.add("active");


    const option = this.select.options[this.select.selectedIndex];


    const planId = this.select.value;
    const plan = this.planData[planId];

    if (!plan) return;


    const salePrice = Number(plan.price);
    const comparePrice = Number(plan.compare_price);

    const save = comparePrice - salePrice;
    const savePercent = Math.round((save / comparePrice) * 100);

    this.querySelector(".sale-price").textContent =
      Shopify.formatMoney(salePrice, "${{amount}}");

    this.querySelector(".compare-price").textContent =
      Shopify.formatMoney(comparePrice, "${{amount}}");

    this.querySelector(".save-badge").textContent =
      `SAVE ${savePercent}%`;

    this.querySelector(".subscription-save-text").textContent =
      `Save ${Shopify.formatMoney(save, "${{amount}}")} today and on every shipment`;



    // Update hidden input
    this.updateHiddenInput();
  }

  updatePurchaseOption() {

    const checked = this.querySelector(".purchase-option:checked");

    // Active class
    this.cards.forEach(card => card.classList.remove("active"));

    if (checked) {
      checked.closest(".purchase-card").classList.add("active");
    }

    // Subscription হলে price/updateHiddenInput update হবে
    if (checked && checked.value !== "") {

      if (this.select) {
        this.updateSellingPlan();
      } else {
        this.updateHiddenInput();
      }

    } else {

      // One Time Purchase
      const hiddenInput = this.getSellingPlanInput();

      if (hiddenInput) {

        hiddenInput.value = "";

        hiddenInput.dispatchEvent(
          new Event("change", {
            bubbles: true
          })
        );

      }

    }

  }

}

customElements.define("purchase-options", PurchaseOptions);
