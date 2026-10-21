// ============================================================
//  app.js — POS 시스템 전체 기능 로직
//  의존: data.js 가 먼저 로드되어야 합니다
// ============================================================

/* ═══════════════════════════════════════════
   상수 / 설정
═══════════════════════════════════════════ */
const COLORS=['#4f8ef7','#4caf7d','#f0a04a','#e05a5a','#a78bfa','#38bdf8','#f472b6','#34d399','#fb923c','#e879f9','#facc15','#6ee7b7'];
const EMOJIS=['☕','🍵','🧃','🧋','🍺','🥤','🧊','🍕','🍔','🌮','🍜','🍱','🍣','🍛','🍰','🧁','🍩','🍪','🍫','🧇','🥐','🥗','🍎','🍇','🫐','🧀','🥩','🍗','🌭','🥪','🎁','📦','🛒','💡','🎀','🌸','🏷️','⭐','🔥','✨'];

/* ═══════════════════════════════════════════
   데이터 헬퍼
═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   상태
═══════════════════════════════════════════ */
let cart={}, emoji='☕', selColor=COLORS[0], selCatId=null, filterCat='all';
let periodFilter='all', customFrom=null, customTo=null;
let expandedDay=null;
let drillTab={};
let lastSaleId=null;   // 방금 결제한 거래 ID
let cancelTargetId=null; // 취소 확인 중인 거래 ID

/* ═══════════════════════════════════════════
   시계
═══════════════════════════════════════════ */
setInterval(()=>{
  const n=new Date();
  document.getElementById('clock').textContent=n.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
},1000);

/* ═══════════════════════════════════════════
   뷰 전환
═══════════════════════════════════════════ */
function switchView(v){
  document.querySelectorAll('.htab').forEach(b=>b.classList.remove('active'));
  const tabMap={'sell':0,'inventory':1,'cancel':2,'history':3};
  document.querySelectorAll('.htab')[tabMap[v]]?.classList.add('active');
  document.getElementById('view-sell').style.display=v==='sell'?'grid':'none';
  ['inventory','cancel','history'].forEach(id=>document.getElementById('view-'+id).classList.toggle('active',id===v));
  if(v==='sell')      renderSell();
  if(v==='inventory') renderInvView();
  if(v==='cancel')    renderCancelView();
  if(v==='history')   renderHistoryView();
}

/* ═══════════════════════════════════════════
   판매 뷰
═══════════════════════════════════════════ */
function renderSell(){renderCatBar();renderBlocks();}

function renderCatBar(){
  const cats=gC();
  document.getElementById('cat-bar').innerHTML=
    `<button class="ctab${filterCat==='all'?' active':''}" style="${filterCat==='all'?'background:var(--accent);border-color:var(--accent)':''}" onclick="setFilter('all')">전체</button>`+
    cats.map(c=>`<button class="ctab${filterCat===c.id?' active':''}" style="${filterCat===c.id?`background:${c.color};border-color:${c.color}`:''}" onclick="setFilter('${c.id}')">${c.name}</button>`).join('');
}
function setFilter(id){filterCat=id;renderCatBar();renderBlocks();}

function renderBlocks(){
  const cats=gC(), products=gP();
  const area=document.getElementById('product-area');
  const visCats=filterCat==='all'?cats:cats.filter(c=>c.id===filterCat);
  let html='';
  visCats.forEach(cat=>{
    const prods=products.filter(p=>p.catId===cat.id);
    if(filterCat==='all'&&!prods.length)return;
    html+=`<div class="cat-block">
      <div class="cat-block-hdr">
        <span class="cat-block-label" style="color:${cat.color}">${cat.name}</span>
        <div class="cat-block-line" style="background:${cat.color}33"></div>
        <span class="cat-block-cnt">${prods.length}개 상품</span>
      </div>
      <div class="pgrid">`;
    if(!prods.length){html+='<div class="cat-empty">이 카테고리에 상품이 없습니다</div>';}
    else prods.forEach(p=>{
      const idx=products.indexOf(p);
      const inf=p.stock===null;
      const out=!inf&&p.stock<=0, low=!inf&&!out&&p.stock<=5;
      const bc=out?'b-out':low?'b-low':'b-ok', bt=out?'품절':inf?'∞ 무제한':low?`${p.stock}개 남음`:`${p.stock}개`;
      html+=`<div class="pcard${out?' out':''}" onclick="addToCart(${idx})">
        <span class="pbadge ${bc}">${bt}</span>
        <div class="pcard-emoji" style="border-bottom:2px solid ${cat.color}22">${p.emoji||'📦'}</div>
        <div class="pcard-info"><div class="pcard-name">${p.name}</div><div class="pcard-price">${fmt(p.price)}</div></div>
      </div>`;
    });
    html+='</div></div>';
  });
  if(filterCat==='all'){
    const uncat=products.filter(p=>!p.catId||!cats.find(c=>c.id===p.catId));
    if(uncat.length){
      html+=`<div class="cat-block"><div class="cat-block-hdr"><span class="cat-block-label" style="color:var(--muted)">미분류</span><div class="cat-block-line"></div><span class="cat-block-cnt">${uncat.length}개</span></div><div class="pgrid">`;
      uncat.forEach(p=>{
        const idx=products.indexOf(p);
        const out=p.stock<=0&&p.stock!==null,low=p.stock!==null&&!out&&p.stock<=5;
        const bc=out?'b-out':low?'b-low':'b-ok',bt=out?'품절':p.stock===null?'∞ 무제한':low?`${p.stock}개 남음`:`${p.stock}개`;
        html+=`<div class="pcard${out?' out':''}" onclick="addToCart(${idx})"><span class="pbadge ${bc}">${bt}</span><div class="pcard-emoji">${p.emoji||'📦'}</div><div class="pcard-info"><div class="pcard-name">${p.name}</div><div class="pcard-price">${fmt(p.price)}</div></div></div>`;
      });
      html+='</div></div>';
    }
  }
  if(!html)html='<div style="color:var(--hint);font-size:13px;padding:2rem;text-align:center">재고 관리에서 카테고리와 상품을 추가해보세요</div>';
  area.innerHTML=html;
}

/* 장바구니 */
function addToCart(idx){
  const p=gP()[idx];if(!p||(p.stock!==null&&p.stock<=0))return;
  if(p.stock!==null&&(cart[idx]||0)>=p.stock){toast('재고가 부족합니다');return;}
  cart[idx]=(cart[idx]||0)+1;renderCart();
}
function changeQty(idx,d){
  const ps=gP();cart[idx]=(cart[idx]||0)+d;
  if(cart[idx]<=0)delete cart[idx];
  else if(ps[idx].stock!==null&&cart[idx]>ps[idx].stock){cart[idx]=ps[idx].stock;toast('최대 수량입니다');}
  renderCart();
}
function removeItem(idx){delete cart[idx];renderCart();}
function clearCart(){cart={};renderCart();}
function renderCart(){
  const ps=gP(),keys=Object.keys(cart).filter(k=>cart[k]>0);
  const el=document.getElementById('order-list');
  if(!keys.length){
    el.innerHTML='<div class="oempty">상품을 선택하면<br>여기에 담겨요</div>';
    document.getElementById('total-amount').textContent='0원';
    document.getElementById('item-count').textContent='0개';
    document.getElementById('btn-pay').disabled=true;return;
  }
  let total=0,qty=0;
  el.innerHTML=keys.map(k=>{
    const p=ps[k],q=cart[k],sub=p.price*q;total+=sub;qty+=q;
    return `<div class="oitem">
      <span class="oi-name">${p.emoji||''} ${p.name}</span>
      <div class="qctrl">
        <button class="qbtn" onclick="changeQty(${k},-1)">−</button>
        <span class="qnum">${q}</span>
        <button class="qbtn" onclick="changeQty(${k},1)">+</button>
      </div>
      <span class="oi-price">${fmt(sub)}</span>
      <span class="oi-del" onclick="removeItem(${k})">✕</span>
    </div>`;
  }).join('');
  document.getElementById('total-amount').textContent=fmt(total);
  document.getElementById('item-count').textContent=`${qty}개`;
  document.getElementById('btn-pay').disabled=false;
}

/* 결제 */
function openPayModal(){
  const ps=gP(),keys=Object.keys(cart).filter(k=>cart[k]>0);if(!keys.length)return;
  const items=keys.map(k=>({name:ps[k].name,emoji:ps[k].emoji||'',catId:ps[k].catId,qty:cart[k],price:ps[k].price,sub:ps[k].price*cart[k]}));
  const total=items.reduce((a,b)=>a+b.sub,0);
  document.getElementById('modal-amount').textContent=fmt(total);
  document.getElementById('modal-items').innerHTML=items.map(it=>`<span>${it.emoji} ${it.name} ×${it.qty}</span><span style="float:right">${fmt(it.sub)}</span>`).join('<br>');
  document.getElementById('pay-modal').classList.add('show');
  const prods=gP();keys.forEach(k=>{if(prods[k].stock!==null)prods[k].stock-=cart[k];});sP(prods);
  const saleId='sale_'+Date.now();
  const hist=gH();hist.unshift({id:saleId,time:new Date().toLocaleString('ko-KR'),ts:Date.now(),items,total,cancelled:false});sH(hist);
  lastSaleId=saleId;
  cart={};renderCart();renderBlocks();
}
function closeModal(){document.getElementById('pay-modal').classList.remove('show');}

/* ── 취소 공통 함수 ── */
function openCancelModal(saleId){
  const hist=gH();
  const sale=hist.find(r=>r.id===saleId);
  if(!sale||sale.cancelled){toast('취소할 수 없는 거래입니다');return;}
  cancelTargetId=saleId;
  document.getElementById('cancel-amount').textContent=fmt(sale.total);
  document.getElementById('cancel-items').innerHTML=sale.items.map(it=>
    `${it.emoji||''} ${it.name} ×${it.qty} — ${fmt(it.sub)}`
  ).join('<br>');
  document.getElementById('cancel-modal').classList.add('show');
}

function openCancelFromPayModal(){
  closeModal();
  if(!lastSaleId){toast('취소할 거래가 없습니다');return;}
  openCancelModal(lastSaleId);
}

function closeCancelModal(){
  document.getElementById('cancel-modal').classList.remove('show');
  cancelTargetId=null;
}

function confirmCancel(){
  if(!cancelTargetId)return;
  const hist=gH();
  const idx=hist.findIndex(r=>r.id===cancelTargetId);
  if(idx<0){toast('거래를 찾을 수 없습니다');closeCancelModal();return;}
  const sale=hist[idx];

  // 재고 복구 (무한 재고 상품은 제외)
  const prods=gP();
  sale.items.forEach(it=>{
    const prod=prods.find(p=>p.name===it.name&&p.catId===it.catId);
    if(prod&&prod.stock!==null) prod.stock+=it.qty;
  });
  sP(prods);

  // 거래 취소 처리
  hist[idx]={...sale,cancelled:true,cancelTime:new Date().toLocaleString('ko-KR')};
  sH(hist);

  closeCancelModal();
  toast('결제가 취소되었습니다');
  lastSaleId=null;
  renderBlocks();

  // 열려 있는 뷰 갱신
  if(document.getElementById('view-history').classList.contains('active')) renderHistoryView();
  if(document.getElementById('view-cancel').classList.contains('active'))  renderCancelView();
}

/* ═══════════════════════════════════════════
   재고 관리 뷰
═══════════════════════════════════════════ */
function renderInvView(){renderSwatches();renderCatMgr();renderCatSelGrid();renderInvTable();}
function renderSwatches(){
  document.getElementById('swatch-row').innerHTML=COLORS.map(c=>
    `<div class="swatch${c===selColor?' sel':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('');
}
function pickColor(c){selColor=c;renderSwatches();}
function addCategory(){
  const name=document.getElementById('inp-cat-name').value.trim();
  if(!name){toast('카테고리 이름을 입력해주세요');return;}
  const cats=gC();if(cats.find(c=>c.name===name)){toast('이미 있는 카테고리입니다');return;}
  cats.push({id:'c'+Date.now(),name,color:selColor});sC(cats);
  document.getElementById('inp-cat-name').value='';
  toast(`"${name}" 추가됨`);renderCatMgr();renderCatSelGrid();renderCatBar();
}
function deleteCategory(id){
  const cats=gC(),cat=cats.find(c=>c.id===id);
  if(!confirm(`"${cat.name}" 카테고리를 삭제할까요?`))return;
  sC(cats.filter(c=>c.id!==id));
  if(selCatId===id)selCatId=null;if(filterCat===id)filterCat='all';
  toast('삭제됨');renderCatMgr();renderCatSelGrid();
}
function renderCatMgr(){
  const cats=gC(),ps=gP(),el=document.getElementById('cat-mgr-grid');
  if(!cats.length){el.innerHTML='<span style="font-size:13px;color:var(--hint)">아직 카테고리가 없습니다</span>';return;}
  el.innerHTML=cats.map(c=>{
    const cnt=ps.filter(p=>p.catId===c.id).length;
    return `<div class="cmcard"><div class="cmdot" style="background:${c.color}"></div><span class="cmname">${c.name}</span><span class="cmcnt">${cnt}개</span><button class="btn-delcat" onclick="deleteCategory('${c.id}')">✕</button></div>`;
  }).join('');
}
function renderCatSelGrid(){
  const cats=gC(),el=document.getElementById('cat-sel-grid');
  if(!cats.length){el.innerHTML='<span style="font-size:13px;color:var(--hint)">먼저 카테고리를 만들어주세요</span>';return;}
  el.innerHTML=cats.map(c=>
    `<button class="csbtn${selCatId===c.id?' sel':''}" style="${selCatId===c.id?`background:${c.color}`:''}" onclick="pickCat('${c.id}')">
      <span class="cdot" style="background:${c.color}"></span>${c.name}
    </button>`).join('');
}
function pickCat(id){selCatId=selCatId===id?null:id;renderCatSelGrid();}
function addProduct(){
  const name=document.getElementById('inp-name').value.trim();
  const price=parseInt(document.getElementById('inp-price').value)||0;
  const stockEl=document.getElementById('inp-stock');
  const isInf=stockEl.disabled;
  const stock=isInf?null:(parseInt(stockEl.value)||0);
  if(!name||price<=0){toast('상품명과 가격을 입력해주세요');return;}
  const ps=gP();ps.push({name,price,stock,catId:selCatId,emoji});sP(ps);
  document.getElementById('inp-name').value='';document.getElementById('inp-price').value='';stockEl.value='';
  // 무한 토글 초기화
  stockEl.disabled=false;stockEl.placeholder='50';
  const tb=document.getElementById('inf-toggle');tb.style.background='var(--surface2)';tb.style.color='var(--muted)';tb.style.borderColor='var(--border)';
  toast('상품 등록 완료');renderInvTable();renderCatMgr();
}
function renderInvTable(){
  const ps=gP(),cats=gC(),tb=document.getElementById('inv-tbody');
  if(!ps.length){tb.innerHTML='<tr><td colspan="7" style="color:var(--hint);padding:1.5rem 10px">등록된 상품이 없습니다</td></tr>';return;}
  tb.innerHTML=ps.map((p,i)=>{
    const cat=cats.find(c=>c.id===p.catId);
    const catHtml=cat
      ?`<span class="cat-pill" style="background:${cat.color}22;color:${cat.color}"><span style="width:6px;height:6px;border-radius:50%;background:${cat.color};display:inline-block"></span>${cat.name}</span>`
      :`<span style="font-size:12px;color:var(--hint)">미분류</span>`;
    const isInf=p.stock===null;
    const stockDisplay=isInf?'<span style="color:var(--accent);font-weight:700">∞</span>':`${p.stock}개`;
    const stockInput=isInf
      ?`<input type="number" class="tbl-input" value="" placeholder="∞" disabled style="opacity:.5;text-align:center">
         <button onclick="setInfTable(${i},false)" title="수량 지정으로 변경" style="padding:3px 8px;border:1px solid var(--border);border-radius:5px;background:var(--surface2);color:var(--muted);font-size:12px;cursor:pointer;margin-left:4px">수량 지정</button>`
      :`<input type="number" class="tbl-input" value="${p.stock}" min="0" onchange="updateStock(${i},this.value)">
         <button onclick="setInfTable(${i},true)" title="무한 재고로 변경" style="padding:3px 8px;border:1px solid var(--border);border-radius:5px;background:var(--surface2);color:var(--muted);font-size:12px;cursor:pointer;margin-left:4px">∞</button>`;
    return `<tr><td>${p.emoji||'📦'}</td><td>${p.name}</td><td>${catHtml}</td><td>${fmt(p.price)}</td><td>${stockDisplay}</td><td style="display:flex;align-items:center">${stockInput}</td><td><button class="btn-edit" onclick="openEditModal(${i})">수정</button></td><td><button class="btn-del" onclick="delProduct(${i})">삭제</button></td></tr>`;
  }).join('');
}
function updateStock(i,v){const ps=gP();ps[i].stock=Math.max(0,parseInt(v)||0);sP(ps);toast('수량 수정됨');}
function setInfTable(i,toInf){
  const ps=gP();ps[i].stock=toInf?null:0;sP(ps);
  toast(toInf?'무한 재고로 변경됨':'수량 지정으로 변경됨');
  renderInvTable();
}
/* ══════════════════════════════════════════════
   거래 내역 뷰
══════════════════════════════════════════════ */
let cancelFilterStatus = 'all';
let txDetailId  = null;
let txCancelSel = {};

function setCancelFilter(status, btn) {
  cancelFilterStatus = status;
  document.querySelectorAll('#cancel-filter-all,#cancel-filter-active,#cancel-filter-done')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCancelView();
}

function renderCancelView() {
  const allHist = gH();
  const dateVal = document.getElementById('cancel-filter-date').value;
  let filtered = allHist;
  if (dateVal)
    filtered = filtered.filter(r => toDateKey(r.ts || new Date(r.time).getTime()) === dateVal);
  if (cancelFilterStatus === 'active')
    filtered = filtered.filter(r => !r.cancelled && !(r.partialCancels || []).length);
  if (cancelFilterStatus === 'cancelled')
    filtered = filtered.filter(r => r.cancelled || (r.partialCancels || []).length > 0);

  // 요약 카드
  const normalRecs = filtered.filter(r => !r.cancelled);
  const cancelRecs = filtered.filter(r => r.cancelled);
  const activeRev  = normalRecs.reduce((a, b) => a + b.total, 0);
  const cancelRev  = cancelRecs.reduce((a, b) => a + b.total, 0);
  document.getElementById('cancel-summary').innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 16px;display:flex;flex-direction:column;gap:3px;min-width:120px">
      <span style="font-size:11px;color:var(--muted)">정상 거래</span>
      <span style="font-size:18px;font-weight:700;color:var(--success)">${normalRecs.length}건</span>
      <span style="font-size:12px;color:var(--muted)">${fmt(activeRev)}</span>
    </div>
    <div style="background:var(--surface);border:1px solid var(--danger);border-radius:var(--radius-sm);padding:10px 16px;display:flex;flex-direction:column;gap:3px;min-width:120px">
      <span style="font-size:11px;color:var(--danger)">취소 거래</span>
      <span style="font-size:18px;font-weight:700;color:var(--danger)">${cancelRecs.length}건</span>
      <span style="font-size:12px;color:var(--muted)">${fmt(cancelRev)}</span>
    </div>`;

  const listEl = document.getElementById('cancel-list');
  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty-msg">해당 조건의 거래 내역이 없습니다</div>';
    return;
  }

  const sorted = [...filtered].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  listEl.innerHTML = `<div class="tx-block-grid">${sorted.map(r => {
    const isCancelled = r.cancelled === true;
    const hasPartial  = (r.partialCancels || []).length > 0;
    const parts   = r.time.split(' ');
    const dateStr = parts[0] || '';
    const timeStr = parts[1] || r.time;
    const itemCount = r.items.reduce((a, b) => a + b.qty, 0);

    // 일부취소 시 남은 실제 금액 계산
    let displayAmt = r.total;
    if (hasPartial && !isCancelled) {
      const cMap = {};
      (r.partialCancels || []).forEach(pc => { cMap[pc.itemIdx] = (cMap[pc.itemIdx] || 0) + pc.qty; });
      const cancelledAmt = r.items.reduce((s, it, i) => s + it.price * (cMap[i] || 0), 0);
      displayAmt = r.total - cancelledAmt;
    }

    let badge = '';
    if (isCancelled)
      badge = `<span class="tx-block-badge" style="background:rgba(224,90,90,.18);color:var(--danger)">전체취소</span>`;
    else if (hasPartial)
      badge = `<span class="tx-block-badge" style="background:rgba(240,160,74,.18);color:var(--amber)">일부취소</span>`;

    return `<div class="tx-block${isCancelled ? ' tx-cancelled' : hasPartial ? ' tx-partial' : ''}"
        onclick="openTxDetail('${r.id}')">
      ${badge}
      <div class="tx-block-date">${dateStr}<br>${timeStr}</div>
      <div class="tx-block-amt">${fmt(displayAmt)}</div>
      <div class="tx-block-meta">${itemCount}개 · ${r.items.length}종류</div>
    </div>`;
  }).join('')}</div>`;
}

/* 상세 팝업 열기 */
function openTxDetail(saleId) {
  txDetailId  = saleId;
  txCancelSel = {};
  const r = gH().find(h => h.id === saleId);
  if (!r) return;
  const isCancelled = r.cancelled === true;

  document.getElementById('txd-time').textContent      = r.time;
  document.getElementById('txd-total-amt').textContent = fmt(r.total);
  document.getElementById('txd-status').innerHTML = isCancelled
    ? `<span class="tx-badge-cancel" style="font-size:12px;padding:4px 11px">전체 취소됨</span>`
    : `<span class="tx-badge-ok"     style="font-size:12px;padding:4px 11px">정상 거래</span>`;
  document.getElementById('txd-guide').style.display = isCancelled ? 'none' : 'block';

  _renderTxItems(r);
  _renderTxActions(r);
  document.getElementById('tx-detail-modal').classList.add('show');
}

function closeTxDetail() {
  document.getElementById('tx-detail-modal').classList.remove('show');
  txDetailId  = null;
  txCancelSel = {};
}

/* 상품 목록 렌더링 */
function _renderTxItems(r) {
  const isCancelled = r.cancelled === true;
  const cMap = {};
  (r.partialCancels || []).forEach(pc => { cMap[pc.itemIdx] = (cMap[pc.itemIdx] || 0) + pc.qty; });

  document.getElementById('txd-items').innerHTML = r.items.map((it, i) => {
    const cancelledQty = cMap[i] || 0;
    const remainQty    = it.qty - cancelledQty;
    const rowDone      = isCancelled || remainQty <= 0;
    const selQty       = txCancelSel[i] || 0;

    const checkHtml = rowDone
      ? `<input type="checkbox" class="txd-check" disabled>`
      : `<input type="checkbox" class="txd-check" id="txd-chk-${i}"
           onchange="toggleTxItem(${i},${remainQty})" ${selQty > 0 ? 'checked' : ''}>`;

    const qtyHtml = (!rowDone && selQty > 0)
      ? `<div class="txd-qty-ctrl">
           <button class="txd-qty-btn" onclick="changeTxSelQty(${i},-1,${remainQty})">−</button>
           <span class="txd-qty-num">${selQty}</span>
           <button class="txd-qty-btn" onclick="changeTxSelQty(${i},1,${remainQty})">+</button>
         </div>`
      : '';

    let subHtml;
    if (rowDone) {
      subHtml = `<span style="color:var(--danger);font-size:12px">취소됨</span>`;
    } else if (selQty > 0) {
      subHtml = `<div style="text-align:right">
        <div class="txd-item-sub" style="color:var(--danger)">−${fmt(selQty * it.price)}</div>
        <div style="font-size:11px;color:var(--muted)">잔여 ${remainQty - selQty}개</div>
      </div>`;
    } else {
      subHtml = `<div style="text-align:right">
        <div class="txd-item-sub">${fmt(remainQty * it.price)}</div>
        <div style="font-size:11px;color:var(--muted)">×${remainQty}개</div>
      </div>`;
    }

    const cancelBadge = cancelledQty > 0
      ? `<span style="font-size:10px;color:var(--danger);margin-left:5px">(${cancelledQty}개 취소됨)</span>`
      : '';

    return `<div class="txd-item-row${rowDone ? ' txd-row-cancelled' : ''}">
      ${checkHtml}
      <div class="txd-item-info">
        <div class="txd-item-name">${it.emoji || ''} ${it.name}${cancelBadge}</div>
        <div class="txd-item-price">${fmt(it.price)} / 개 · 원래 ${it.qty}개</div>
      </div>
      <div class="txd-qty-wrap">
        ${qtyHtml}
        ${subHtml}
      </div>
    </div>`;
  }).join('');

  _updateSelBar();
}

function toggleTxItem(i, maxQty) {
  const chk = document.getElementById('txd-chk-' + i);
  if (chk.checked) txCancelSel[i] = maxQty;
  else             delete txCancelSel[i];
  const r = gH().find(h => h.id === txDetailId);
  if (r) _renderTxItems(r);
}

function changeTxSelQty(i, delta, maxQty) {
  txCancelSel[i] = Math.max(1, Math.min(maxQty, (txCancelSel[i] || 0) + delta));
  const r = gH().find(h => h.id === txDetailId);
  if (r) _renderTxItems(r);
}

function _updateSelBar() {
  const r = gH().find(h => h.id === txDetailId);
  if (!r) return;
  let total = 0, cnt = 0;
  Object.entries(txCancelSel).forEach(([i, qty]) => {
    total += r.items[i].price * qty;
    cnt   += qty;
  });
  const bar   = document.getElementById('txd-sel-bar');
  const amt   = document.getElementById('txd-cancel-amt');
  const cntEl = document.getElementById('txd-cancel-cnt');
  if (bar)   bar.classList.toggle('show', total > 0);
  if (amt)   amt.textContent = fmt(total);
  if (cntEl) cntEl.textContent = `${cnt}개 선택`;
}

function _renderTxActions(r) {
  const isCancelled = r.cancelled === true;
  const el = document.getElementById('txd-actions');
  if (isCancelled) {
    el.innerHTML = `<div style="text-align:center;font-size:13px;color:var(--hint);padding:10px 0">전체 취소 완료된 거래입니다</div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btn-no" onclick="closeTxDetail()" style="flex:1">닫기</button>
      <button class="btn-yes" onclick="doPartialCancel()" style="flex:2">선택 항목 취소</button>
    </div>
    <button onclick="closeTxDetail();openCancelModal('${r.id}')"
      style="width:100%;margin-top:8px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s"
      onmouseover="this.style.borderColor='var(--danger)';this.style.color='var(--danger)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">
      전체 취소
    </button>`;
}

function doPartialCancel() {
  const selEntries = Object.entries(txCancelSel).filter(([, q]) => q > 0);
  if (!selEntries.length) { toast('취소할 상품을 선택해주세요'); return; }

  const hist = gH();
  const idx  = hist.findIndex(h => h.id === txDetailId);
  if (idx < 0) return;
  const r = hist[idx];
  const cancelTime = new Date().toLocaleString('ko-KR');

  // 재고 복구
  const prods = gP();
  selEntries.forEach(([i, qty]) => {
    const it   = r.items[i];
    const prod = prods.find(p => p.name === it.name && p.catId === it.catId);
    if (prod && prod.stock !== null) prod.stock += qty;
  });
  sP(prods);

  // 부분취소 기록
  if (!hist[idx].partialCancels) hist[idx].partialCancels = [];
  selEntries.forEach(([i, qty]) => {
    hist[idx].partialCancels.push({ itemIdx: Number(i), qty, time: cancelTime });
  });

  // 전부 취소됐는지 체크
  const cm = {};
  hist[idx].partialCancels.forEach(pc => { cm[pc.itemIdx] = (cm[pc.itemIdx] || 0) + pc.qty; });
  const allDone = r.items.every((it, i) => it.qty === (cm[i] || 0));
  if (allDone) { hist[idx].cancelled = true; hist[idx].cancelTime = cancelTime; }

  sH(hist);
  txCancelSel = {};
  toast('선택한 항목이 취소되었습니다');
  closeTxDetail();
  renderCancelView();
  renderBlocks();
  if (document.getElementById('view-history').classList.contains('active')) renderHistoryView();
}

/* confirmCancel 후 갱신 */


let editIdx=-1, editInfMode=false, editEmoji='☕';

function openEditModal(i){
  editIdx=i;
  const ps=gP(), p=ps[i], cats=gC();
  editEmoji=p.emoji||'📦';
  editInfMode=p.stock===null;
  // 값 채우기
  document.getElementById('edit-emoji-btn').textContent=editEmoji;
  document.getElementById('edit-name').value=p.name;
  document.getElementById('edit-price').value=p.price;
  const stockEl=document.getElementById('edit-stock');
  const infBtn=document.getElementById('edit-inf-btn');
  if(editInfMode){
    stockEl.value='';stockEl.disabled=true;stockEl.placeholder='무제한';
    infBtn.classList.add('on');
  }else{
    stockEl.value=p.stock;stockEl.disabled=false;stockEl.placeholder='0';
    infBtn.classList.remove('on');
  }
  // 카테고리 버튼
  const grid=document.getElementById('edit-cat-grid');
  if(!cats.length){
    grid.innerHTML='<span style="font-size:13px;color:var(--hint)">카테고리 없음</span>';
  }else{
    grid.innerHTML=cats.map(c=>
      `<button class="csbtn${p.catId===c.id?' sel':''}" id="ecbtn-${c.id}"
        style="${p.catId===c.id?`background:${c.color}`:''}"
        onclick="pickEditCat('${c.id}','${c.color}')">
        <span class="cdot" style="background:${c.color}"></span>${c.name}
      </button>`
    ).join('');
  }
  document.getElementById('edit-modal-overlay').classList.add('show');
}

function closeEditModal(){
  document.getElementById('edit-modal-overlay').classList.remove('show');
  editIdx=-1;
}

function toggleInfEdit(){
  editInfMode=!editInfMode;
  const stockEl=document.getElementById('edit-stock');
  const infBtn=document.getElementById('edit-inf-btn');
  if(editInfMode){
    stockEl.value='';stockEl.disabled=true;stockEl.placeholder='무제한';
    infBtn.classList.add('on');
  }else{
    stockEl.disabled=false;stockEl.placeholder='0';
    infBtn.classList.remove('on');
  }
}

function pickEditCat(id, color){
  document.querySelectorAll('#edit-cat-grid .csbtn').forEach(b=>{
    b.classList.remove('sel');b.style.background='';
  });
  const btn=document.getElementById('ecbtn-'+id);
  if(btn){
    // 이미 선택된 걸 다시 누르면 해제
    if(btn.dataset.selected==='1'){btn.dataset.selected='';return;}
    btn.classList.add('sel');btn.style.background=color;btn.dataset.selected='1';
  }
}

function saveProductEdit(){
  if(editIdx<0)return;
  const name=document.getElementById('edit-name').value.trim();
  const price=parseInt(document.getElementById('edit-price').value)||0;
  if(!name||price<=0){toast('상품명과 가격을 입력해주세요');return;}
  const stockEl=document.getElementById('edit-stock');
  const stock=editInfMode?null:Math.max(0,parseInt(stockEl.value)||0);
  // 선택된 카테고리
  const selBtn=document.querySelector('#edit-cat-grid .csbtn.sel');
  const catId=selBtn?selBtn.id.replace('ecbtn-',''):null;
  const ps=gP();
  ps[editIdx]={...ps[editIdx],name,price,stock,catId:catId||ps[editIdx].catId,emoji:editEmoji};
  sP(ps);
  toast('상품이 수정되었습니다');
  closeEditModal();
  renderInvTable();renderCatMgr();
}

function togglePickerEdit(e){
  e.stopPropagation();
  const pk=document.getElementById('emoji-picker');
  if(!pk.classList.contains('show')){
    const r=document.getElementById('edit-emoji-btn').getBoundingClientRect();
    pk.style.top=(r.bottom+6)+'px';pk.style.left=r.left+'px';
    pk.innerHTML=EMOJIS.map(em=>`<div class="ep-item" onclick="pickEmojiEdit('${em}')">${em}</div>`).join('');
    pk.classList.add('show');
  }else pk.classList.remove('show');
}
function pickEmojiEdit(em){
  editEmoji=em;
  document.getElementById('edit-emoji-btn').textContent=em;
  document.getElementById('emoji-picker').classList.remove('show');
}
function toggleInfNew(){
  infNewMode=!infNewMode;
  const inp=document.getElementById('inp-stock');
  const btn=document.getElementById('inf-toggle');
  if(infNewMode){
    inp.disabled=true;inp.value='';inp.placeholder='무제한';
    btn.style.background='var(--accent)';btn.style.color='#fff';btn.style.borderColor='var(--accent)';
  }else{
    inp.disabled=false;inp.placeholder='50';
    btn.style.background='var(--surface2)';btn.style.color='var(--muted)';btn.style.borderColor='var(--border)';
  }
}
function delProduct(i){const ps=gP();if(!confirm(`"${ps[i].name}"을 삭제할까요?`))return;ps.splice(i,1);sP(ps);renderInvTable();renderCatMgr();toast('삭제됨');}

/* ═══════════════════════════════════════════
   판매 기록 뷰 — 핵심 로직
═══════════════════════════════════════════ */

/* 날짜 문자열 → 'YYYY-MM-DD' */
function toDateKey(ts){
  const d=new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDateKey(dk){
  const [y,m,d]=dk.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}
function dayOfWeek(dk){
  const days=['일','월','화','수','목','금','토'];
  return days[new Date(dk).getDay()]+'요일';
}

/* 기간 필터 적용 후 history 배열 반환 */
function getFilteredHistory(){
  const h=gH();
  const now=new Date();
  if(periodFilter==='today'){
    const dk=toDateKey(now.getTime());
    return h.filter(r=>toDateKey(r.ts||new Date(r.time).getTime())===dk);
  }
  if(periodFilter==='week'){
    const start=new Date(now);start.setDate(now.getDate()-now.getDay());start.setHours(0,0,0,0);
    return h.filter(r=>new Date(r.ts||new Date(r.time).getTime())>=start);
  }
  if(periodFilter==='month'){
    return h.filter(r=>{const d=new Date(r.ts||new Date(r.time).getTime());return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();});
  }
  if(periodFilter==='custom'&&customFrom&&customTo){
    const from=new Date(customFrom);from.setHours(0,0,0,0);
    const to=new Date(customTo);to.setHours(23,59,59,999);
    return h.filter(r=>{const d=new Date(r.ts||new Date(r.time).getTime());return d>=from&&d<=to;});
  }
  return h;
}

/* 일자별로 그룹핑 */
function groupByDay(records){
  const map={};
  records.forEach(r=>{
    const dk=toDateKey(r.ts||new Date(r.time).getTime());
    if(!map[dk])map[dk]=[];
    map[dk].push(r);
  });
  // 날짜 내림차순 정렬
  return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0]));
}

function setPeriod(p,btn){
  periodFilter=p;
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const cr=document.getElementById('custom-range');
  cr.style.display=p==='custom'?'flex':'none';
  expandedDay=null;
  renderHistoryView();
}
function applyCustomRange(){
  customFrom=document.getElementById('date-from').value;
  customTo=document.getElementById('date-to').value;
  if(!customFrom||!customTo){toast('날짜를 모두 선택해주세요');return;}
  expandedDay=null;
  renderHistoryView();
}

function renderHistoryView(){
  const filtered=getFilteredHistory();
  renderStatCards(filtered);
  renderDayTable(filtered);
}

/* 요약 통계 카드 */
function renderStatCards(records){
  const active=records.filter(r=>!r.cancelled);
  const cancelled=records.filter(r=>r.cancelled);
  const totalRev=active.reduce((a,b)=>a+b.total,0);
  const totalTx=active.length;
  const totalItems=active.reduce((a,b)=>a+b.items.reduce((c,d)=>c+d.qty,0),0);
  const avgTx=totalTx?Math.round(totalRev/totalTx):0;
  document.getElementById('stat-grid').innerHTML=`
    <div class="stat-card ac"><div class="stat-lbl">총 매출</div><div class="stat-val" style="font-size:17px">${fmt(totalRev)}</div></div>
    <div class="stat-card"><div class="stat-lbl">거래 건수</div><div class="stat-val">${totalTx}건</div></div>
    <div class="stat-card"><div class="stat-lbl">총 판매 수량</div><div class="stat-val">${totalItems}개</div></div>
    <div class="stat-card"><div class="stat-lbl">평균 객단가</div><div class="stat-val" style="font-size:16px">${fmt(avgTx)}</div></div>
    ${cancelled.length?`<div class="stat-card" style="border-color:var(--danger);grid-column:1/-1"><div class="stat-lbl" style="color:var(--danger)">취소 건수</div><div class="stat-val" style="font-size:16px;color:var(--danger)">${cancelled.length}건 취소 (${fmt(cancelled.reduce((a,b)=>a+b.total,0))} 환불)</div></div>`:''}`;
}

/* 일자별 테이블 렌더링 */
function renderDayTable(records){
  const groups=groupByDay(records);
  const grandTotal=records.filter(r=>!r.cancelled).reduce((a,b)=>a+b.total,0);
  const tbody=document.getElementById('day-tbody');

  if(!groups.length){
    tbody.innerHTML=`<tr><td colspan="6" class="empty-msg">해당 기간에 판매 기록이 없습니다</td></tr>`;
    return;
  }

  let html='';
  groups.forEach(([dk,recs])=>{
    const activeRecs=recs.filter(r=>!r.cancelled);
    const cancelRecs=recs.filter(r=>r.cancelled);
    const dayRev=activeRecs.reduce((a,b)=>a+b.total,0);
    const dayItems=activeRecs.reduce((a,b)=>a+b.items.reduce((c,d)=>c+d.qty,0),0);
    const pct=grandTotal?Math.round(dayRev/grandTotal*100):0;
    const isExp=expandedDay===dk;
    const tab=drillTab[dk]||'cat';
    const cancelBadge=cancelRecs.length?`<span style="font-size:11px;color:var(--danger);margin-left:6px">취소 ${cancelRecs.length}건</span>`:'';
    html+=`<tr class="day-row${isExp?' expanded':''}" onclick="toggleDay('${dk}')">
      <td><span class="day-expand-icon${isExp?' open':''}">▶</span></td>
      <td>
        <div style="font-weight:500">${fmtDateKey(dk)}${cancelBadge}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${dayOfWeek(dk)}</div>
      </td>
      <td class="day-cnt">${activeRecs.length}건</td>
      <td class="day-cnt">${dayItems}개</td>
      <td class="day-total">${fmt(dayRev)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;min-width:50px">
            <div style="width:${pct}%;height:100%;background:var(--accent);border-radius:3px"></div>
          </div>
          <span style="font-size:11px;color:var(--muted);min-width:28px">${pct}%</span>
        </div>
      </td>
    </tr>
    <tr class="drill-row${isExp?' show':''}" id="drill-${dk}">
      <td class="drill-cell" colspan="6">
        <div class="drill-inner">
          <div class="drill-tabs">
            <button class="dtab${tab==='cat'?' active':''}" onclick="setDrillTab('${dk}','cat',event)">카테고리별</button>
            <button class="dtab${tab==='prod'?' active':''}" onclick="setDrillTab('${dk}','prod',event)">상품별</button>
            <button class="dtab${tab==='tx'?' active':''}" onclick="setDrillTab('${dk}','tx',event)">거래 내역</button>
          </div>
          <div id="drill-content-${dk}">
            ${renderDrillContent(dk, recs, tab)}
          </div>
        </div>
      </td>
    </tr>`;
  });
  tbody.innerHTML=html;
}

/* 날짜 행 클릭 → 펼치기/접기 */
function toggleDay(dk){
  expandedDay=expandedDay===dk?null:dk;
  if(expandedDay&&!drillTab[dk])drillTab[dk]='cat';
  // 현재 필터된 records 다시 계산
  const filtered=getFilteredHistory();
  renderDayTable(filtered);
}

/* 드릴다운 탭 전환 */
function setDrillTab(dk,tab,e){
  e.stopPropagation();
  drillTab[dk]=tab;
  const filtered=getFilteredHistory();
  const groups=groupByDay(filtered);
  const dayRecs=(groups.find(([d])=>d===dk)||[dk,[]])[1];
  document.getElementById('drill-content-'+dk).innerHTML=renderDrillContent(dk,dayRecs,tab);
  // 탭 활성화 갱신
  const drillEl=document.getElementById('drill-'+dk);
  drillEl.querySelectorAll('.dtab').forEach((b,i)=>b.classList.toggle('active',['cat','prod','tx'][i]===tab));
}

/* 드릴다운 콘텐츠 HTML 생성 */
function renderDrillContent(dk, recs, tab){
  if(tab==='cat') return renderCatDrill(recs);
  if(tab==='prod') return renderProdDrill(recs);
  if(tab==='tx') return renderTxDrill(recs);
  return '';
}

/* ── 카테고리별 드릴다운 ── */
function renderCatDrill(recs){
  const cats=gC();
  const catMap={};
  recs.forEach(r=>r.items.forEach(it=>{
    const catId=it.catId||'uncat';
    if(!catMap[catId])catMap[catId]={rev:0,qty:0};
    catMap[catId].rev+=it.sub;
    catMap[catId].qty+=it.qty;
  }));
  const entries=Object.entries(catMap).sort((a,b)=>b[1].rev-a[1].rev);
  const maxRev=entries.length?entries[0][1].rev:1;
  if(!entries.length)return '<div class="empty-msg">데이터 없음</div>';
  return '<div class="cat-bars">'+entries.map(([catId,data])=>{
    const cat=cats.find(c=>c.id===catId);
    const name=cat?cat.name:'미분류';
    const color=cat?cat.color:COLORS[8];
    const pct=Math.round(data.rev/maxRev*100);
    return `<div class="cat-bar-row">
      <div class="cat-bar-label" style="color:${color}">${name}</div>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:${pct}%;background:${color};color:#fff">${pct<15?'':data.qty+'개'}</div>
      </div>
      <div class="cat-bar-stat"><span style="font-weight:700;color:${color}">${fmt(data.rev)}</span><br><span style="font-size:11px">${data.qty}개 판매</span></div>
    </div>`;
  }).join('')+'</div>';
}

/* ── 상품별 드릴다운 ── */
function renderProdDrill(recs){
  const cats=gC();
  const prodMap={};
  recs.forEach(r=>r.items.forEach(it=>{
    const key=it.name;
    if(!prodMap[key])prodMap[key]={rev:0,qty:0,emoji:it.emoji||'📦',catId:it.catId};
    prodMap[key].rev+=it.sub;
    prodMap[key].qty+=it.qty;
  }));
  const entries=Object.entries(prodMap).sort((a,b)=>b[1].rev-a[1].rev);
  if(!entries.length)return '<div class="empty-msg">데이터 없음</div>';
  return '<div class="prod-rank-list">'+entries.map(([name,data],i)=>{
    const cat=cats.find(c=>c.id===data.catId);
    const catName=cat?cat.name:'미분류';
    const catColor=cat?cat.color:COLORS[8];
    const medalColor=i===0?'#facc15':i===1?'#b0b8c8':i===2?'#cd7f32':null;
    return `<div class="prod-rank-item">
      <div class="rank-num" style="${medalColor?`color:${medalColor};font-size:16px`:''}">${medalColor?['🥇','🥈','🥉'][i]:i+1}</div>
      <div class="rank-emoji">${data.emoji}</div>
      <div class="rank-info">
        <div class="rank-name">${name}</div>
        <div class="rank-cat"><span style="display:inline-flex;align-items:center;gap:3px"><span style="width:5px;height:5px;border-radius:50%;background:${catColor};display:inline-block"></span>${catName}</span></div>
      </div>
      <div class="rank-qty">${data.qty}개</div>
      <div class="rank-rev">${fmt(data.rev)}</div>
    </div>`;
  }).join('')+'</div>';
}

/* ── 거래 내역 드릴다운 ── */
function renderTxDrill(recs){
  if(!recs.length)return '<div class="empty-msg">거래 내역 없음</div>';
  const sorted=[...recs].sort((a,b)=>(b.ts||0)-(a.ts||0));
  return '<div class="tx-list">'+sorted.map(r=>{
    const isCancelled=r.cancelled===true;
    const badge=isCancelled
      ?'<span class="tx-badge-cancel">취소됨</span>'
      :`<span class="tx-badge-ok">정상</span>`;
    const cancelBtn=isCancelled
      ?`<span style="font-size:12px;color:var(--hint)">취소 완료</span>`
      :`<button onclick="openCancelModal('${r.id}')" style="padding:4px 10px;border:1px solid var(--danger);border-radius:5px;background:none;color:var(--danger);font-size:12px;cursor:pointer;font-family:inherit;transition:all .15s" onmouseover="this.style.background='var(--danger)';this.style.color='#fff'" onmouseout="this.style.background='none';this.style.color='var(--danger)'">취소</button>`;
    return `<div class="tx-item${isCancelled?' cancelled':''}">
      <div class="tx-top">
        <span class="tx-time">${r.time}${badge}</span>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tx-total"${isCancelled?' style="text-decoration:line-through;opacity:.5"':''}>${fmt(r.total)}</span>
          ${cancelBtn}
        </div>
      </div>
      <div class="tx-items">${r.items.map(it=>`${it.emoji||''} ${it.name} ×${it.qty} (${fmt(it.sub)})`).join('  ·  ')}</div>
      ${isCancelled&&r.cancelTime?`<div style="font-size:11px;color:var(--danger);margin-top:4px">취소 시각: ${r.cancelTime}</div>`:''}
    </div>`;
  }).join('')+'</div>';
}

/* CSV 내보내기 */
function exportCSV(){
  const h=getFilteredHistory();
  if(!h.length){toast('판매 기록이 없습니다');return;}
  const rows=[['날짜','시간','상품명','카테고리','수량','단가','소계','거래합계']];
  const cats=gC();
  h.forEach(r=>{
    const dk=toDateKey(r.ts||new Date(r.time).getTime());
    r.items.forEach((it,i)=>{
      const cat=cats.find(c=>c.id===it.catId);
      rows.push([i===0?dk:'',r.time,it.name,cat?cat.name:'미분류',it.qty,it.price,it.sub,i===0?r.total:'']);
    });
  });
  const csv='\uFEFF'+rows.map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`판매기록_${new Date().toLocaleDateString('ko-KR').replace(/\.\s*/g,'-')}.csv`;
  a.click();toast('CSV 저장 완료');
}

/* ═══════════════════════════════════════════
   이모지 피커
═══════════════════════════════════════════ */
function togglePicker(e){
  e.stopPropagation();
  const pk=document.getElementById('emoji-picker');
  if(!pk.classList.contains('show')){
    const r=document.getElementById('emoji-btn').getBoundingClientRect();
    pk.style.top=(r.bottom+6)+'px';pk.style.left=r.left+'px';
    pk.innerHTML=EMOJIS.map(em=>`<div class="ep-item" onclick="pickEmoji('${em}')">${em}</div>`).join('');
    pk.classList.add('show');
  }else pk.classList.remove('show');
}
document.addEventListener('click',()=>document.getElementById('emoji-picker').classList.remove('show'));
function pickEmoji(em){emoji=em;document.getElementById('emoji-btn').textContent=em;document.getElementById('emoji-picker').classList.remove('show');}

/* ═══════════════════════════════════════════
   유틸
═══════════════════════════════════════════ */
function fmt(n){return Number(n).toLocaleString('ko-KR')+'원';}
function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}

/* 초기 렌더 */
renderSell();
renderSwatches();