// Funcionalidades DOM - Pelucas Caninas
const STORAGE_CART = "pelucasCarrito";
const STORAGE_THEME = "pelucasTema";

const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_CART)) || [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  updateCartCount();
  renderCartPanel();
}

function updateCartCount() {
  const count = getCart().reduce((total, item) => total + item.cantidad, 0);
  qsa("#cartCount").forEach((el) => (el.textContent = count));
}

function addToCart(producto) {
  const cart = getCart();
  const existente = cart.find((item) => item.nombre === producto.nombre);

  if (existente) {
    existente.cantidad += 1;
  } else {
    cart.push({ ...producto, cantidad: 1 });
  }

  saveCart(cart);
  showToast(`${producto.nombre} agregado al carrito`);
}

function removeFromCart(nombre) {
  const cart = getCart().filter((item) => item.nombre !== nombre);
  saveCart(cart);
}

function changeQuantity(nombre, cantidad) {
  const cart = getCart();
  const item = cart.find((producto) => producto.nombre === nombre);
  if (!item) return;

  item.cantidad += cantidad;
  if (item.cantidad <= 0) {
    removeFromCart(nombre);
    return;
  }

  saveCart(cart);
}

function renderCartPanel() {
  const cartBody = qs("#cartItems");
  const cartTotal = qs("#cartTotal");
  if (!cartBody || !cartTotal) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartBody.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
    cartTotal.textContent = "S/ 0.00";
    return;
  }

  cartBody.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.nombre}">
        <div class="cart-item-info">
          <h4>${item.nombre}</h4>
          <p>S/ ${Number(item.precio).toFixed(2)}</p>
          <div class="cart-quantity">
            <button type="button" data-action="minus" data-name="${item.nombre}">-</button>
            <span>${item.cantidad}</span>
            <button type="button" data-action="plus" data-name="${item.nombre}">+</button>
          </div>
        </div>
        <button type="button" class="cart-remove" data-action="remove" data-name="${item.nombre}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
  cartTotal.textContent = `S/ ${total.toFixed(2)}`;
}

function createCartPanel() {
  if (qs("#cartPanel")) return;

  const panel = document.createElement("aside");
  panel.id = "cartPanel";
  panel.className = "cart-panel";
  panel.innerHTML = `
    <div class="cart-header">
      <h3>Carrito de compras</h3>
      <button type="button" id="cartClose" aria-label="Cerrar carrito">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div id="cartItems" class="cart-items"></div>
    <div class="cart-footer">
      <div class="cart-total-row">
        <strong>Total:</strong>
        <strong id="cartTotal">S/ 0.00</strong>
      </div>
      <a id="cartWhatsapp" class="cart-whatsapp" target="_blank" href="#">
        <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
      </a>
    </div>`;

  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.className = "cart-overlay";

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  renderCartPanel();
}

function openCart() {
  createCartPanel();
  qs("#cartPanel").classList.add("activo");
  qs("#cartOverlay").classList.add("activo");
  updateWhatsappCartLink();
}

function closeCart() {
  qs("#cartPanel")?.classList.remove("activo");
  qs("#cartOverlay")?.classList.remove("activo");
}

function updateWhatsappCartLink() {
  const link = qs("#cartWhatsapp");
  if (!link) return;

  const cart = getCart();
  if (cart.length === 0) {
    link.href = "https://wa.me/51937317249?text=Hola,%20quiero%20información%20sobre%20sus%20productos.";
    return;
  }

  const detalle = cart
    .map((item) => `- ${item.nombre} x${item.cantidad} (S/ ${Number(item.precio).toFixed(2)})`)
    .join("\n");
  const total = cart.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
  const mensaje = `Hola, quiero hacer un pedido:\n${detalle}\nTotal: S/ ${total.toFixed(2)}`;
  link.href = `https://wa.me/51937317249?text=${encodeURIComponent(mensaje)}`;
}

function setupDarkMode() {
  if (localStorage.getItem(STORAGE_THEME) === "oscuro") {
    document.body.classList.add("dark-mode");
  }

  qsa("#darkModeToggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const oscuro = document.body.classList.contains("dark-mode");
      localStorage.setItem(STORAGE_THEME, oscuro ? "oscuro" : "claro");
      btn.innerHTML = oscuro
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    });
  });

  const oscuro = document.body.classList.contains("dark-mode");
  qsa("#darkModeToggle").forEach((btn) => {
    btn.innerHTML = oscuro
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  });
}

function setupProductSearch() {
  const input = qs("#buscadorProductos");
  const cards = qsa(".productos-grid .tarjeta");
  const empty = qs("#sinResultados");
  if (!input || cards.length === 0) return;

  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase().trim();
    let visibles = 0;

    cards.forEach((card) => {
      const contenido = card.textContent.toLowerCase();
      const coincide = contenido.includes(texto);
      card.style.display = coincide ? "flex" : "none";
      if (coincide) visibles++;
    });

    if (empty) empty.classList.toggle("activo", visibles === 0);
  });
}

function setupCartEvents() {
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".btn-add-cart");
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      const card = addBtn.closest(".tarjeta");
      if (!card) return;
      addToCart({
        nombre: card.dataset.nombre,
        precio: Number(card.dataset.precio),
        img: card.dataset.img,
      });
    }

    const cartBtn = e.target.closest("#cartToggle");
    if (cartBtn) openCart();

    if (e.target.closest("#cartClose") || e.target.closest("#cartOverlay")) closeCart();

    const cartAction = e.target.closest("[data-action]");
    if (cartAction && cartAction.closest("#cartPanel")) {
      const name = cartAction.dataset.name;
      const action = cartAction.dataset.action;
      if (action === "plus") changeQuantity(name, 1);
      if (action === "minus") changeQuantity(name, -1);
      if (action === "remove") removeFromCart(name);
      updateWhatsappCartLink();
    }
  });
}

function injectDetailAddButton() {
  const detail = qs(".producto-grande");
  if (!detail || qs(".btn-add-detail")) return;

  const title = qs(".producto-info h1")?.textContent.trim();
  const priceText = qs(".producto-info h2")?.textContent.replace("S/", "").trim();
  const img = qs(".producto-img img")?.getAttribute("src");
  const botones = qs(".producto-info .botones");
  if (!title || !priceText || !img || !botones) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-add-detail";
  btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Agregar al carrito';
  btn.addEventListener("click", () => {
    addToCart({ nombre: title, precio: Number(priceText), img });
  });

  botones.prepend(btn);
}

function setupFormValidation() {
  const form = qs(".formulario-libro");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(form);

    let valid = true;
    const requiredFields = qsa("input[required], textarea[required]", form);

    requiredFields.forEach((field) => {
      if ((field.type === "checkbox" || field.type === "radio") && !field.checked) return;
      if (!field.value.trim()) {
        showFieldError(field, "Este campo es obligatorio.");
        valid = false;
      }
    });

    const email = qs('input[type="email"]', form);
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showFieldError(email, "Ingresa un correo válido.");
      valid = false;
    }

    const phone = qs('input[type="tel"]', form);
    if (phone && phone.value.trim() && !/^[0-9+\s]{7,15}$/.test(phone.value.trim())) {
      showFieldError(phone, "Ingresa un teléfono válido.");
      valid = false;
    }

    ["bien", "tipo"].forEach((name) => {
      if (!qs(`input[name="${name}"]:checked`, form)) {
        const group = qs(`input[name="${name}"]`, form);
        showFieldError(group, "Selecciona una opción.");
        valid = false;
      }
    });

    qsa('input[type="checkbox"][required]', form).forEach((check) => {
      if (!check.checked) {
        showFieldError(check, "Debes marcar esta casilla.");
        valid = false;
      }
    });

    if (!valid) return;

    showToast("Formulario validado correctamente");
    form.reset();
  });
}

function showFieldError(field, message) {
  const target = field.closest("label") || field;
  target.classList.add("campo-error");
  const error = document.createElement("small");
  error.className = "mensaje-error";
  error.textContent = message;
  target.insertAdjacentElement("afterend", error);
}

function clearErrors(form) {
  qsa(".campo-error", form).forEach((el) => el.classList.remove("campo-error"));
  qsa(".mensaje-error", form).forEach((el) => el.remove());
}

function createFloatingWhatsapp() {
  if (qs(".whatsapp-flotante")) return;

  const link = document.createElement("a");
  link.href = "https://wa.me/51937317249?text=Hola,%20quiero%20información%20sobre%20Pelucas%20Caninas.";
  link.target = "_blank";
  link.className = "whatsapp-flotante";
  link.setAttribute("aria-label", "Escríbenos por WhatsApp");
  link.innerHTML = '<i class="fab fa-whatsapp"></i>';
  document.body.appendChild(link);
}

function showToast(message) {
  let toast = qs("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("activo");
  setTimeout(() => toast.classList.remove("activo"), 2500);
}


function setupHeroImageSlider() {
  const slides = qsa(".hero-bg-slider img");
  if (slides.length <= 1) return;

  let indice = 0;
  setInterval(() => {
    slides[indice].classList.remove("activo");
    indice = (indice + 1) % slides.length;
    slides[indice].classList.add("activo");
  }, 4500);
}

function setupGalleryModal() {
  const images = qsa(".galeria-track img");
  if (images.length === 0) return;

  const modal = document.createElement("div");
  modal.className = "galeria-modal";
  modal.innerHTML = `
    <button type="button" class="galeria-modal-cerrar" aria-label="Cerrar imagen">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <img src="" alt="Mascota ampliada">
  `;
  document.body.appendChild(modal);

  const modalImg = qs("img", modal);

  images.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => {
      modalImg.src = img.src;
      modalImg.alt = img.alt || "Mascota ampliada";
      modal.classList.add("activo");
    });
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".galeria-modal-cerrar")) {
      modal.classList.remove("activo");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.remove("activo");
  });
}

function setupRelatedProductsAutoScroll() {
  const contenedor = qs(".contenedor-productos");
  if (!contenedor) return;

  let pausado = false;
  contenedor.addEventListener("mouseenter", () => (pausado = true));
  contenedor.addEventListener("mouseleave", () => (pausado = false));

  setInterval(() => {
    if (pausado) return;
    const limite = contenedor.scrollWidth - contenedor.clientWidth;
    if (limite <= 0) return;
    if (contenedor.scrollLeft >= limite - 2) {
      contenedor.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      contenedor.scrollLeft += 1;
    }
  }, 24);
}


document.addEventListener("DOMContentLoaded", () => {
  createCartPanel();
  setupHeroImageSlider();
  setupGalleryModal();
  setupRelatedProductsAutoScroll();
  setupDarkMode();
  setupProductSearch();
  setupCartEvents();
  injectDetailAddButton();
  setupFormValidation();
  createFloatingWhatsapp();
  updateCartCount();
});
