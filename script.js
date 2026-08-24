const WHATSAPP = "5573999360975";

const products = [
  {id:1, category:"Copos", name:"Rota São João Batista", desc:"Açaí com morango e granola. Produto real da Rota do Açaí.", image:"assets/rota-sao-joao-batista.png", price:18},
  {id:2, category:"Copos", name:"Rota Muritiba", desc:"Açaí com confeitos coloridos e complemento cremoso.", image:"assets/rota-muritiba.png", price:18},
  {id:3, category:"Kids", name:"Açaí Kids 1 🍭💜", desc:"Opção divertida com doces, confeitos e canudinho.", image:"assets/acai-kids-1.png", price:16},
  {id:4, category:"Copos", name:"Açaí Tradicional", desc:"Açaí tradicional com banana e granola.", image:"assets/acai-tradicional.png", price:17},
  {id:5, category:"Barcas", name:"Barca", desc:"Barca de açaí com creme, frutas, confeitos e complementos.", image:"assets/barca.png", price:35}
];

const FRUITS = ["Morango","Banana","Uva","Kiwi","Manga"];
const ADDONS = [
  {name:"Granola",price:0},{name:"Leite em pó",price:0},{name:"Paçoca",price:0},
  {name:"Confeitos",price:2},{name:"Jujuba",price:2},{name:"Chocolate",price:3}
];

const state = {
  category:"Todos",
  search:"",
  cart:JSON.parse(localStorage.getItem("rota-acai-demo-cart")||"[]")
};
let customizerContext = null;

const $ = s => document.querySelector(s);
const money = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function categories(){ return ["Todos",...new Set(products.map(p=>p.category))]; }

function renderTabs(){
  $("#categoryTabs").innerHTML = categories().map(c=>`<button class="${state.category===c?"active":""}" data-cat="${c}">${c}</button>`).join("");
  document.querySelectorAll("#categoryTabs button").forEach(b=>b.onclick=()=>{
    state.category=b.dataset.cat; renderTabs(); renderProducts();
  });
}

function renderProducts(){
  const term=state.search.toLowerCase().trim();
  const list=products.filter(p=>(state.category==="Todos"||p.category===state.category)&&(!term||`${p.name} ${p.desc} ${p.category}`.toLowerCase().includes(term)));
  $("#productsGrid").innerHTML=list.map(p=>`
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-body">
        <span class="product-tag">${p.category}</span>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="price-row">
          <span class="price">${money(p.price)}*</span>
          <button class="add-btn" data-id="${p.id}">Personalizar</button>
        </div>
      </div>
    </article>`).join("");
  document.querySelectorAll(".add-btn").forEach(b=>b.onclick=()=>openCustomizer(products.find(p=>p.id===Number(b.dataset.id))));
}

function openCustomizer(product){
  customizerContext=product;
  $("#customizerTitle").textContent=product.name;
  $("#customizerSummary").innerHTML=`<strong>${product.category}</strong><span>${product.desc}</span><b>Preço demonstrativo: ${money(product.price)}</b>`;
  $("#fruitOptions").innerHTML=FRUITS.map(f=>`<label class="addon-option"><input type="checkbox" data-type="fruit" value="${f}"><span><b>${f}</b><small>+ R$ 0,00</small></span></label>`).join("");
  $("#addonOptions").innerHTML=ADDONS.map(a=>`<label class="addon-option"><input type="checkbox" data-type="addon" value="${a.name}" data-price="${a.price}"><span><b>${a.name}</b><small>${a.price?`+ ${money(a.price)}`:"grátis*"}</small></span></label>`).join("");
  $("#itemNote").value="";
  document.querySelectorAll("#customizerModal input").forEach(i=>i.onchange=updateCustomizerTotal);
  updateCustomizerTotal();
  $("#customizerModal").classList.add("open");
  $("#customizerOverlay").classList.add("show");
}
function closeCustomizer(){
  $("#customizerModal").classList.remove("open");
  $("#customizerOverlay").classList.remove("show");
  customizerContext=null;
}
function updateCustomizerTotal(){
  if(!customizerContext)return;
  let total=customizerContext.price;
  document.querySelectorAll('#customizerModal input[data-type="addon"]:checked').forEach(i=>total+=Number(i.dataset.price));
  $("#customizerTotal").textContent=money(total);
}
function confirmCustomizer(){
  if(!customizerContext)return;
  const fruits=[...document.querySelectorAll('#customizerModal input[data-type="fruit"]:checked')].map(i=>i.value);
  const addons=[...document.querySelectorAll('#customizerModal input[data-type="addon"]:checked')].map(i=>({name:i.value,price:Number(i.dataset.price)}));
  const note=$("#itemNote").value.trim();
  const extra=addons.reduce((s,a)=>s+a.price,0);
  const key=`${customizerContext.id}-${[...fruits,...addons.map(a=>a.name)].sort().join("|")}-${note}`;
  const existing=state.cart.find(i=>i.key===key);
  if(existing) existing.qty++;
  else state.cart.push({
    key,id:customizerContext.id,name:customizerContext.name,category:customizerContext.category,
    fruits,addons,note,price:customizerContext.price+extra,qty:1
  });
  saveCart(); closeCustomizer(); openCart();
}

function saveCart(){
  localStorage.setItem("rota-acai-demo-cart",JSON.stringify(state.cart));
  renderCart();
}
function renderCart(){
  const qty=state.cart.reduce((s,i)=>s+i.qty,0);
  const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  $("#cartCount").textContent=qty;
  $("#cartTotal").textContent=money(total);
  $("#floatingText").textContent=`Sacola (${qty}) • ${money(total)}`;
  $("#floatingCart").classList.toggle("visible", qty > 0);
  if(!qty){
    $("#cartItems").innerHTML=`<div class="empty"><div style="font-size:2.3rem">🫐</div><h3>Sua sacola está vazia</h3><p>Escolha um produto para começar.</p></div>`;
    return;
  }
  $("#cartItems").innerHTML=state.cart.map(i=>`
    <div class="cart-item">
      <div class="cart-item-top"><div><strong>${i.name}</strong><div class="meta">
        ${i.fruits.length?`Frutas: ${i.fruits.join(", ")}<br>`:""}
        ${i.addons.length?`Complementos: ${i.addons.map(a=>a.name).join(", ")}<br>`:""}
        ${i.note?`Obs.: ${i.note}`:""}
      </div></div><strong>${money(i.price*i.qty)}</strong></div>
      <div class="qty-row">
        <button data-act="minus" data-key="${i.key}">−</button><span>${i.qty}</span>
        <button data-act="plus" data-key="${i.key}">+</button>
        <button class="remove" data-act="remove" data-key="${i.key}">Remover</button>
      </div>
    </div>`).join("");
  document.querySelectorAll(".qty-row button").forEach(b=>b.onclick=()=>updateCart(b.dataset.key,b.dataset.act));
}
function updateCart(key,act){
  const item=state.cart.find(i=>i.key===key); if(!item)return;
  if(act==="plus")item.qty++;
  if(act==="minus")item.qty--;
  if(act==="remove"||item.qty<=0)state.cart=state.cart.filter(i=>i.key!==key);
  saveCart();
}

function openCart(){ $("#cartDrawer").classList.add("open"); $("#overlay").classList.add("show"); }
function closeCart(){ $("#cartDrawer").classList.remove("open"); $("#overlay").classList.remove("show"); }

function selected(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value||""; }
function updateService(){
  $("#deliveryFields").classList.toggle("hidden",selected("service")!=="Entrega");
}
function validate(){
  if(!state.cart.length)return "Adicione pelo menos um produto.";
  if(!$("#customerName").value.trim())return "Informe seu nome.";
  if(selected("service")==="Entrega"&&(!$("#street").value.trim()||!$("#number").value.trim()||!$("#district").value.trim()))return "Preencha rua, número e bairro para entrega.";
  return "";
}
function finishOrder(e){
  e.preventDefault();
  const err=validate(); if(err){alert(err);return;}
  const service=selected("service");
  const total=state.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const lines=state.cart.map(i=>{
    const d=[];
    if(i.fruits.length)d.push(`  ↳ Frutas: ${i.fruits.join(", ")}`);
    if(i.addons.length)d.push(`  ↳ Complementos: ${i.addons.map(a=>a.name).join(", ")}`);
    if(i.note)d.push(`  ↳ Obs.: ${i.note}`);
    return [`• ${i.qty}x ${i.name} — ${money(i.price*i.qty)}`,...d].join("\n");
  });
  const msg=[
    "💜 *NOVO PEDIDO — ROTA DO AÇAÍ (DEMO)*","",
    `👤 Cliente: ${$("#customerName").value.trim()}`,"",
    ...lines,"",`📦 Tipo: ${service}`
  ];
  if(service==="Retirada") msg.push("📍 Retirada: Rua Professora Carmen Palma, nº 12 — São Jorge, Jaguaquara/BA");
  else{
    msg.push(`📍 Endereço: ${$("#street").value.trim()}, nº ${$("#number").value.trim()} — ${$("#district").value.trim()}`);
    if($("#complement").value.trim())msg.push(`🏠 Complemento: ${$("#complement").value.trim()}`);
    if($("#reference").value.trim())msg.push(`📌 Referência: ${$("#reference").value.trim()}`);
    msg.push("🚚 Taxa de entrega: a confirmar com a loja");
  }
  if($("#generalNotes").value.trim())msg.push("",`📝 Observações gerais: ${$("#generalNotes").value.trim()}`);
  msg.push("",`💰 *TOTAL DEMONSTRATIVO: ${money(total)}*`);
  msg.push("⚠️ Valores e taxa de entrega desta demo precisam ser confirmados pela Rota do Açaí antes do uso oficial.");
  msg.push("","Pode confirmar disponibilidade e valor final, por favor?");
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg.join("\n"))}`,"_blank");
}

$("#searchInput").oninput=e=>{state.search=e.target.value;renderProducts()};
$("#openCart").onclick=openCart;
$("#floatingCart").onclick=openCart;
$("#closeCart").onclick=closeCart;
$("#overlay").onclick=closeCart;
$("#closeCustomizer").onclick=closeCustomizer;
$("#customizerOverlay").onclick=closeCustomizer;
$("#confirmCustomizer").onclick=confirmCustomizer;
document.querySelectorAll('input[name="service"]').forEach(i=>i.onchange=updateService);
$("#checkoutForm").onsubmit=finishOrder;

renderTabs(); renderProducts(); renderCart(); updateService();
