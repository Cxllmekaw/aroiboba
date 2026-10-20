'use strict';
const KEY='aroi-boba-pro-v1';
const initial=()=>({ingredients:[{id:'i1',name:'ชาดำ',unit:'กรัม',stock:2500,price:0.35},{id:'i2',name:'นม',unit:'มล.',stock:12000,price:0.055},{id:'i3',name:'ไข่มุก',unit:'กรัม',stock:4500,price:0.14},{id:'i4',name:'น้ำตาลบราวน์',unit:'กรัม',stock:2500,price:0.12},{id:'i5',name:'ไซรัปคาราเมล',unit:'มล.',stock:1800,price:0.23},{id:'i6',name:'ผงมัทฉะ',unit:'กรัม',stock:800,price:1.4},{id:'i7',name:'แก้ว+ฝา+หลอด',unit:'ชุด',stock:500,price:3}],products:[{id:'p1',name:'ชานมไข่มุก',emoji:'🧋',price:39,recipe:{i1:12,i2:150,i3:45,i7:1}},{id:'p2',name:'ชานมบราวน์ชูการ์',emoji:'🍯',price:45,recipe:{i1:10,i2:150,i3:45,i4:25,i7:1}},{id:'p3',name:'นมสดคาราเมลไข่มุก',emoji:'🥛',price:40,recipe:{i2:200,i3:45,i5:25,i7:1}},{id:'p4',name:'มัทฉะลาเต้ไข่มุก',emoji:'🍵',price:45,recipe:{i2:180,i3:45,i6:8,i7:1}}],sales:[],expenses:[]});
function load(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.products)&&Array.isArray(d.ingredients)&&Array.isArray(d.sales)&&Array.isArray(d.expenses))return d}catch{}return initial()}
let db=load(),cart={},page='dashboard',modalHandler=null;const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],money=n=>'฿'+Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}),num=n=>Number(n||0),dateStr=d=>new Date(d).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}),uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}function toast(s){const e=$('#toast');e.textContent=s;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600)}function cost(p){return Object.entries(p.recipe||{}).reduce((sum,[id,q])=>sum+num(q)*num(db.ingredients.find(i=>i.id===id)?.price),0)}function metrics(sales=db.sales,expenses=db.expenses){const revenue=sales.reduce((a,s)=>a+s.total,0),cogs=sales.reduce((a,s)=>a+s.cost,0),expense=expenses.reduce((a,e)=>a+e.amount,0),count=sales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);return{revenue,cogs,expense,profit:revenue-cogs-expense,count,orders:sales.length}}
function navigate(p){page=p;$$('.page').forEach(x=>x.classList.toggle('active',x.id===p));$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('#pageTitle').textContent=({dashboard:'ภาพรวมร้านค้า',sales:'บันทึกยอดขาย',products:'เมนูและต้นทุน',inventory:'คลังวัตถุดิบ',expenses:'ค่าใช้จ่าย',reports:'รายงานยอดขาย',assistant:'AI Insights'})[p];render();window.scrollTo({top:0,behavior:'smooth'})}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="empty">ยังไม่มีข้อมูล</td></tr>`}</tbody></table></div>`}
function stats(m){return [['💰','รายได้รวม',money(m.revenue),'ยอดขายที่บันทึก'],['🧾','ต้นทุนวัตถุดิบ',money(m.cogs),'ต้นทุน ณ เวลาขาย'],['✨','กำไรประมาณการ',money(m.profit),'หลังหักค่าใช้จ่าย'],['🧋','จำนวนแก้ว',m.count.toLocaleString('th-TH'),'จาก '+m.orders+' ออเดอร์']].map(x=>`<div class="stat"><div class="stat-top">${x[1]} <span class="stat-icon">${x[0]}</span></div><div class="stat-value">${x[2]}</div><div class="stat-sub">${x[3]}</div></div>`).join('')}
function render(){const m=metrics();$('#stats').innerHTML=stats(m);$('#recentSales').innerHTML=salesTable(db.sales.slice(0,5));const rank=db.products.map(p=>({p,qty:db.sales.reduce((a,s)=>a+s.items.filter(i=>i.id===p.id).reduce((b,i)=>b+i.qty,0),0)})).sort((a,b)=>b.qty-a.qty);const max=Math.max(1,...rank.map(r=>r.qty));$('#topProducts').innerHTML=rank.map(r=>`<div class="rank"><div class="rank-icon">${esc(r.p.emoji)}</div><div class="rank-info"><div class="rank-name">${esc(r.p.name)}</div><div class="rank-meta">${money(r.p.price)} / แก้ว</div><div class="bar"><div class="bar-fill" style="width:${r.qty/max*100}%"></div></div></div><div class="rank-count">${r.qty}</div></div>`).join('');renderChart();renderSales();renderProducts();renderInventory();renderExpenses();renderReports()}
function renderChart(){const canvas=$('#salesChart'),ctx=canvas.getContext('2d'),w=canvas.clientWidth||500,h=230,dpr=devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);return d}),values=days.map(d=>db.sales.filter(s=>new Date(s.date).toDateString()===d.toDateString()).reduce((a,s)=>a+s.total,0)),max=Math.max(100,...values)*1.15,pad=34,plotW=w-pad-12,plotH=h-58;ctx.strokeStyle='#f0e5de';ctx.fillStyle='#9a8279';ctx.font='11px Outfit';for(let i=0;i<=4;i++){const y=12+plotH*i/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-12,y);ctx.stroke();ctx.fillText(Math.round(max*(4-i)/4).toString(),2,y+3)}const pts=values.map((v,i)=>({x:pad+plotW*i/6,y:12+plotH*(1-v/max)}));ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#b87961';ctx.lineWidth=3;ctx.stroke();pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#b87961';ctx.fill();ctx.fillStyle='#9a8279';ctx.fillText(`${days[i].getDate()}/${days[i].getMonth()+1}`,p.x-11,h-15)})}
function salesTable(sales){return table(['วันที่','รายการ','จำนวน','รายได้','กำไรขั้นต้น',''],sales.map(s=>`<tr><td>${dateStr(s.date)}</td><td>${esc(s.items.map(i=>i.name).join(', '))}</td><td>${s.items.reduce((a,i)=>a+i.qty,0)}</td><td><strong>${money(s.total)}</strong></td><td class="positive">${money(s.total-s.cost)}</td><td><button class="mini-btn danger" data-delete-sale="${s.id}">ลบ</button></td></tr>`))}
function renderSales(){const available=db.products.filter(p=>p.price>0);$('#productPicker').innerHTML=available.map(p=>`<button class="pick" data-pick="${p.id}"><div class="drink-emoji">${esc(p.emoji)}</div><strong>${esc(p.name)}</strong><small>${money(p.price)} · ต้นทุน ${money(cost(p))}</small></button>`).join('');const items=Object.entries(cart).filter(([id,q])=>q>0&&db.products.some(p=>p.id===id));$('#cartItems').innerHTML=items.length?items.map(([id,q])=>{const p=db.products.find(x=>x.id===id);return `<div class="cart-row"><div><strong>${esc(p.name)}</strong><div class="rank-meta">${money(p.price*q)}</div></div><div class="qty"><button data-qty="${id}" data-delta="-1">−</button>${q}<button data-qty="${id}" data-delta="1">+</button></div></div>`}).join(''):'<div class="empty">เลือกเมนูเพื่อเริ่มขาย ♡</div>';const total=items.reduce((a,[id,q])=>a+db.products.find(p=>p.id===id).price*q,0),cogs=items.reduce((a,[id,q])=>a+cost(db.products.find(p=>p.id===id))*q,0);$('#cartTotals').innerHTML=`<div class="total-line"><span>ต้นทุนสินค้า</span><span>${money(cogs)}</span></div><div class="total-line big"><span>ยอดชำระ</span><span>${money(total)}</span></div>`;$('#checkout').disabled=!items.length;$('#salesHistory').innerHTML=salesTable(db.sales)}
function renderProducts(){$('#productsTable').innerHTML=table(['เมนู','ราคาขาย','ต้นทุน/แก้ว','กำไรขั้นต้น/แก้ว','อัตรากำไรขั้นต้น','จัดการ'],db.products.map(p=>{const c=cost(p);return `<tr><td><strong>${esc(p.emoji)} ${esc(p.name)}</strong></td><td>${money(p.price)}</td><td>${money(c)}</td><td class="${p.price-c>=0?'positive':'negative'}">${money(p.price-c)}</td><td>${p.price?((p.price-c)/p.price*100).toFixed(1):'0'}%</td><td><button class="mini-btn" data-edit-product="${p.id}">แก้ไข</button><button class="mini-btn danger" data-delete-product="${p.id}">ลบ</button></td></tr>`}))}
function renderInventory(){$('#inventoryTable').innerHTML=table(['วัตถุดิบ','คงเหลือ','ต้นทุน/หน่วย','มูลค่าสต็อก','จัดการ'],db.ingredients.map(i=>`<tr><td><strong>${esc(i.name)}</strong></td><td class="${i.stock<100?'negative':''}">${num(i.stock).toLocaleString('th-TH')} ${esc(i.unit)}</td><td>${money(i.price)}</td><td>${money(i.stock*i.price)}</td><td><button class="mini-btn" data-edit-ingredient="${i.id}">แก้ไข</button><button class="mini-btn danger" data-delete-ingredient="${i.id}">ลบ</button></td></tr>`))}
function renderExpenses(){$('#expenseTable').innerHTML=table(['วันที่','รายการ','จำนวนเงิน','จัดการ'],db.expenses.map(e=>`<tr><td>${dateStr(e.date)}</td><td>${esc(e.name)}</td><td>${money(e.amount)}</td><td><button class="mini-btn danger" data-delete-expense="${e.id}">ลบ</button></td></tr>`))}
function reportData(){const r=$('#reportRange').value,limit=r==='all'?0:Date.now()-Number(r)*86400000;return{sales:db.sales.filter(s=>!limit||new Date(s.date).getTime()>=limit),expenses:db.expenses.filter(e=>!limit||new Date(e.date).getTime()>=limit)}}
function renderReports(){const {sales,expenses}=reportData(),m=metrics(sales,expenses);$('#reportStats').innerHTML=stats(m);$('#reportTable').innerHTML=table(['เมนู','จำนวนแก้ว','ยอดขาย','ต้นทุน','กำไรขั้นต้น'],db.products.map(p=>{let qty=0,revenue=0,cogs=0;sales.forEach(s=>s.items.filter(i=>i.id===p.id).forEach(i=>{qty+=i.qty;revenue+=i.qty*i.price;cogs+=i.qty*i.unitCost}));return `<tr><td>${esc(p.name)}</td><td>${qty}</td><td>${money(revenue)}</td><td>${money(cogs)}</td><td class="positive">${money(revenue-cogs)}</td></tr>`}))}
function field(name,label,type='text',value='',extra=''){return `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra} required></label>`}
function openModal(title,html,handler){$('#modalTitle').textContent=title;$('#modalFields').innerHTML=html;modalHandler=handler;$('#modal').hidden=false}function closeModal(){$('#modal').hidden=true;modalHandler=null;$('#modalForm').reset()}
function productModal(id){const p=db.products.find(x=>x.id===id),recipe=p?.recipe||{};let html=field('name','ชื่อเมนู','text',p?.name||'')+field('emoji','อีโมจิเมนู','text',p?.emoji||'🧋')+field('price','ราคาขาย (บาท)','number',p?.price??39,'min="0" step="0.01"')+'<h4>สูตรวัตถุดิบต่อแก้ว</h4>'+db.ingredients.map(i=>`<div class="recipe-row"><label>${esc(i.name)} (${esc(i.unit)})</label><input type="number" min="0" step="any" data-recipe="${i.id}" value="${recipe[i.id]||0}"></div>`).join('');openModal(p?'แก้ไขเมนู':'เพิ่มเมนูใหม่',html,f=>{const name=f.get('name').trim(),price=Number(f.get('price'));if(!name||!Number.isFinite(price)||price<0)throw Error('กรุณาตรวจสอบชื่อและราคา');const r={};$$('[data-recipe]').forEach(el=>{const q=Number(el.value);if(!Number.isFinite(q)||q<0)throw Error('จำนวนวัตถุดิบไม่ถูกต้อง');if(q>0)r[el.dataset.recipe]=q});const obj={id:p?.id||uid(),name,emoji:f.get('emoji')||'🧋',price,recipe:r};if(p)Object.assign(p,obj);else db.products.push(obj)})}
function ingredientModal(id){const i=db.ingredients.find(x=>x.id===id);openModal(i?'แก้ไขวัตถุดิบ':'เพิ่มวัตถุดิบ',field('name','ชื่อวัตถุดิบ','text',i?.name||'')+field('unit','หน่วย เช่น กรัม / มล. / ชุด','text',i?.unit||'กรัม')+field('stock','จำนวนคงเหลือ','number',i?.stock??0,'min="0" step="any"')+field('price','ต้นทุนต่อ 1 หน่วย (บาท)','number',i?.price??0,'min="0" step="any"'),f=>{const obj={id:i?.id||uid(),name:f.get('name').trim(),unit:f.get('unit').trim(),stock:Number(f.get('stock')),price:Number(f.get('price'))};if(!obj.name||!obj.unit||![obj.stock,obj.price].every(v=>Number.isFinite(v)&&v>=0))throw Error('ข้อมูลวัตถุดิบไม่ถูกต้อง');if(i)Object.assign(i,obj);else db.ingredients.push(obj)})}
function expenseModal(){openModal('บันทึกค่าใช้จ่าย',field('name','รายการ','text','ค่าไฟ')+field('amount','จำนวนเงิน (บาท)','number',0,'min="0.01" step="0.01"')+field('date','วันที่','date',new Date().toLocaleDateString('en-CA')),f=>{const amount=Number(f.get('amount')),date=f.get('date');if(!f.get('name').trim()||!(amount>0)||!date)throw Error('กรอกข้อมูลค่าใช้จ่ายให้ครบ');db.expenses.unshift({id:uid(),name:f.get('name').trim(),amount,date:new Date(date+'T12:00:00').toISOString()})})}
function completeCheckout(){const selected=Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>({p:db.products.find(p=>p.id===id),qty}));if(!selected.length)return;const needs={};for(const {p,qty} of selected){if(!p)return toast('เมนูถูกลบ กรุณาเลือกใหม่');for(const [id,amount] of Object.entries(p.recipe||{}))needs[id]=(needs[id]||0)+amount*qty}for(const [id,q] of Object.entries(needs)){const i=db.ingredients.find(x=>x.id===id);if(!i||i.stock+1e-8<q)return toast(`วัตถุดิบ ${i?.name||id} ไม่เพียงพอ`)}const items=selected.map(({p,qty})=>({id:p.id,name:p.name,qty,price:p.price,unitCost:cost(p)}));for(const [id,q] of Object.entries(needs))db.ingredients.find(i=>i.id===id).stock=Number((db.ingredients.find(i=>i.id===id).stock-q).toFixed(5));db.sales.unshift({id:uid(),date:new Date().toISOString(),usage:needs,items,total:items.reduce((a,i)=>a+i.qty*i.price,0),cost:items.reduce((a,i)=>a+i.qty*i.unitCost,0)});cart={};save();toast('บันทึกยอดขายและตัดสต็อกเรียบร้อย ♡')}

// Custom confirmation popup shared by every destructive action and checkout.
// Uses textContent for all dynamic content to avoid injecting product or sales data as HTML.
const confirmOverlay=document.getElementById('confirmOverlay');
const confirmAccept=document.getElementById('confirmAccept');
let confirmCallback=null, confirmPreviousFocus=null;
function closeConfirm(){
  if(confirmOverlay.hidden)return;
  confirmOverlay.hidden=true;
  document.body.classList.remove('dialog-open');
  confirmCallback=null;
  if(confirmPreviousFocus && confirmPreviousFocus.isConnected)confirmPreviousFocus.focus();
}
function askConfirm(options,onConfirm){
  if(!confirmOverlay.hidden)return;
  confirmPreviousFocus=document.activeElement;
  document.getElementById('confirmTitle').textContent=options.title || 'ยืนยันรายการนี้ไหมคะ?';
  document.getElementById('confirmMessage').textContent=options.message || 'โปรดตรวจสอบก่อนยืนยันรายการนี้';
  document.getElementById('confirmKicker').textContent=options.kicker || 'AROI BOBA • LITTLE REMINDER';
  document.getElementById('confirmIllustration').firstElementChild.textContent=options.icon || '🧋';
  document.getElementById('confirmCancel').textContent=options.cancelText || 'ยังไม่ลบ';
  confirmAccept.textContent=options.acceptText || 'ใช่ ยืนยันเลย';
  confirmAccept.classList.toggle('confirm-accept--safe',options.tone==='safe');
  const details=document.getElementById('confirmDetails');
  details.replaceChildren();
  if(Array.isArray(options.details) && options.details.length){
    options.details.forEach(item=>{const line=document.createElement('div');line.className='confirm-detail-row';line.textContent=String(item);details.appendChild(line)});
    details.hidden=false;
  }else details.hidden=true;
  confirmCallback=onConfirm;
  confirmOverlay.hidden=false;
  document.body.classList.add('dialog-open');
  document.getElementById('confirmCancel').focus();
}
function confirmDelete(config,fn){
  askConfirm(typeof config==='string'?{title:'ยืนยันการลบรายการ',message:config,icon:'🗑️',acceptText:'ใช่ ลบเลย'}:config,()=>{
    fn();save();toast('ลบรายการเรียบร้อยแล้ว ♡');
  });
}
document.getElementById('confirmClose').addEventListener('click',closeConfirm);
document.getElementById('confirmCancel').addEventListener('click',closeConfirm);
confirmOverlay.addEventListener('click',e=>{if(e.target===confirmOverlay)closeConfirm()});
confirmAccept.addEventListener('click',()=>{
  const action=confirmCallback;closeConfirm();
  if(action)try{action()}catch(err){toast(err?.message||'ดำเนินการไม่สำเร็จ')}
});
confirmOverlay.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();closeConfirm();return}
  if(e.key==='Tab'){
    const focusables=[document.getElementById('confirmClose'),document.getElementById('confirmCancel'),confirmAccept];
    const first=focusables[0],last=focusables[focusables.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
function deleteSaleWithRestock(id){
  const sale=db.sales.find(s=>s.id===id);if(!sale)return toast('ไม่พบรายการขายนี้');
  const usage=sale.usage && typeof sale.usage==='object' ? sale.usage : null;
  const restock=usage?Object.entries(usage).map(([ingredientId,quantity])=>{
    const item=db.ingredients.find(i=>i.id===ingredientId);
    return {ingredientId,quantity:num(quantity),item};
  }):[];
  const missing=restock.filter(x=>!x.item);
  const products=sale.items.map(i=>`${i.name} × ${i.qty} แก้ว`);
  const details=[...products,`ยอดขายที่จะลบ: ${money(sale.total)}`,
    ...restock.map(x=>`↩ คืน ${x.item?.name || 'วัตถุดิบที่ถูกลบ'} ${x.quantity.toLocaleString('th-TH')} ${x.item?.unit || 'หน่วย'}`)];
  if(!usage)details.push('⚠ รายการเก่าไม่บันทึกการใช้วัตถุดิบ ระบบจึงไม่สามารถคืนสต็อกอัตโนมัติได้');
  if(missing.length)details.push('⚠ มีวัตถุดิบบางรายการถูกลบไปแล้ว จึงคืนสต็อกได้ไม่ครบ');
  askConfirm({title:'ลบยอดขายนี้ไหมคะ?',message:usage?'ลบยอดขายนี้และคืนสต็อกวัตถุดิบที่ใช้? รายงานรายได้และกำไรจะปรับตามทันที':'ลบยอดขายนี้? รายการนี้ไม่มีข้อมูลการใช้วัตถุดิบย้อนหลัง จึงคืนสต็อกอัตโนมัติไม่ได้',details,icon:'🧾',acceptText:usage?'ลบยอดขายและคืนสต็อก':'ลบยอดขาย',cancelText:'เก็บยอดขายไว้'},()=>{
    const current=db.sales.find(s=>s.id===id);if(!current)return;
    if(current.usage)for(const [ingredientId,q] of Object.entries(current.usage)){
      const ingredient=db.ingredients.find(i=>i.id===ingredientId);
      if(ingredient)ingredient.stock=Number((num(ingredient.stock)+num(q)).toFixed(5));
    }
    db.sales=db.sales.filter(s=>s.id!==id);
    save();toast(missing.length?'ลบยอดขายแล้ว แต่คืนสต็อกได้เพียงบางรายการ':!usage?'ลบยอดขายแล้ว (ไม่มีข้อมูลคืนสต็อก)':'ลบยอดขายและคืนสต็อกเรียบร้อย ♡');
  });
}

function checkout(){
 const selected=Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>({p:db.products.find(p=>p.id===id),qty}));
 if(!selected.length)return;
 if(selected.some(x=>!x.p))return toast('มีเมนูถูกลบ กรุณาเลือกใหม่');
 const quantities=new Map();
 for(const {p,qty} of selected)for(const [id,q] of Object.entries(p.recipe||{}))quantities.set(id,(quantities.get(id)||0)+q*qty);
 for(const [id,q] of quantities){const ing=db.ingredients.find(i=>i.id===id);if(!ing||ing.stock+1e-8<q)return toast(`สต็อก ${ing?.name||id} ไม่พอสำหรับออเดอร์นี้`)}
 const total=selected.reduce((sum,{p,qty})=>sum+num(p.price)*qty,0);
 const count=selected.reduce((sum,x)=>sum+x.qty,0);
 askConfirm({title:'ยืนยันบันทึกยอดขายไหมคะ?',message:'เมื่อยืนยัน ระบบจะเพิ่มรายการขายและตัดสต็อกวัตถุดิบตามสูตรโดยอัตโนมัติ',icon:'🎀',tone:'safe',
  acceptText:'ยืนยันการขาย ♡',cancelText:'ตรวจสอบอีกครั้ง',details:[...selected.map(({p,qty})=>`${p.name} × ${qty} แก้ว`),`รวม ${count} แก้ว • ชำระ ${money(total)}`]},completeCheckout);
}
function csvDownload(filename,rows){const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'});download(blob,filename)}function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function answer(question){const q=question.toLowerCase(),m=metrics(),today=db.sales.filter(s=>new Date(s.date).toDateString()===new Date().toDateString()),tm=metrics(today,[]),rank=db.products.map(p=>({name:p.name,qty:db.sales.reduce((a,s)=>a+s.items.filter(i=>i.id===p.id).reduce((b,i)=>b+i.qty,0),0)})).sort((a,b)=>b.qty-a.qty);if(/วันนี้|daily|today/.test(q))return `วันนี้ขายได้ ${tm.count} แก้ว จาก ${tm.orders} ออเดอร์ รายได้ ${money(tm.revenue)} และกำไรขั้นต้น ${money(tm.revenue-tm.cogs)} (ยังไม่หักค่าใช้จ่ายอื่น)`;if(/ขายดี|ยอดนิยม|best/.test(q))return rank[0]?.qty?`เมนูขายดีที่สุดคือ ${rank[0].name} ขายได้ ${rank[0].qty} แก้ว 🎉`:'ยังไม่มียอดขาย ลองบันทึกการขายก่อนนะ';if(/กำไร|profit/.test(q))return `รายได้รวม ${money(m.revenue)} − ต้นทุนวัตถุดิบ ${money(m.cogs)} − ค่าใช้จ่าย ${money(m.expense)} = กำไรประมาณการ ${money(m.profit)} (ยังไม่รวมรายการที่ไม่ได้บันทึก)`;if(/ราคา|price|ปรับ/.test(q)){const sorted=db.products.map(p=>({p,margin:p.price?100*(p.price-cost(p))/p.price:0})).sort((a,b)=>a.margin-b.margin),low=sorted[0];return low?`${low.p.name} มีอัตรากำไรขั้นต้นประมาณ ${low.margin.toFixed(1)}% ต่ำสุดในร้าน ลองตรวจสอบต้นทุนจริงและราคาตลาดก่อนปรับราคา โดยตัวเลขนี้ยังไม่รวมค่าเช่าและค่าแรง`:'เพิ่มเมนูก่อนนะ'}if(/ต้นทุน|cost/.test(q))return db.products.map(p=>`${p.name}: ${money(cost(p))}/แก้ว`).join('\n');if(/สต็อก|วัตถุดิบ/.test(q))return db.ingredients.map(i=>`${i.name}: ${i.stock} ${i.unit}`).join('\n');return 'ฉันช่วยสรุปยอดขายวันนี้ กำไร ต้นทุน เมนูขายดี และแนวทางตั้งราคาได้ ลองถามเรื่องเหล่านี้ได้เลย 🧋'}
// Store assistant conversation separately from business records. Clearing chat never alters db.
const CHAT_KEY = 'aroi-boba-chat-history-v1';
const WELCOME_CHAT = 'สวัสดีค่า 🧋 ลองถามเรื่องร้าน Aroi Boba ได้เลยนะ!';
function readChatHistory(){
  try { const raw=JSON.parse(localStorage.getItem(CHAT_KEY));
    if(Array.isArray(raw)) return raw.filter(m => m && (m.role==='user'||m.role==='bot') && typeof m.text==='string').slice(-120);
  } catch(e) { /* ignore malformed old data */ }
  return [];
}
let chatHistory = readChatHistory();
function renderChatHistory(){
  const log=$('#chatLog');
  log.innerHTML=chatHistory.length ? chatHistory.map(m=>`<div class="chat ${m.role}">${esc(m.text)}</div>`).join('') : `<div class="chat bot">${esc(WELCOME_CHAT)}</div>`;
  log.scrollTop=log.scrollHeight;
}
function sendChat(q){
  const question=String(q).trim().slice(0,700);
  if(!question)return;
  chatHistory.push({role:'user',text:question},{role:'bot',text:answer(question)});
  chatHistory=chatHistory.slice(-120);
  try {localStorage.setItem(CHAT_KEY,JSON.stringify(chatHistory))} catch(e) {toast('พื้นที่จัดเก็บแชตเต็ม จึงบันทึกแชตข้ามการเปิดเว็บไม่ได้')}
  renderChatHistory();
}
function clearChat(){
  chatHistory=[];
  try{localStorage.removeItem(CHAT_KEY)}catch(e){}
  renderChatHistory();
  toast('ลบประวัติแชตเรียบร้อยแล้ว ♡');
}
document.getElementById('clearChatBtn').addEventListener('click',()=>{
  askConfirm({title:'ลบประวัติแชต AI ใช่ไหมคะ?',
    message:'ข้อความทั้งหมดที่คุยกับ Boba Buddy จะถูกลบและกู้คืนไม่ได้ แต่ยอดขาย สต็อก ต้นทุน และกำไรยังอยู่ครบเหมือนเดิมนะ ♡',
    icon:'💬',acceptText:'ใช่ ลบแชตเลย',cancelText:'ยังไม่ลบ'},clearChat);
});
renderChatHistory();
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)navigate(b.dataset.page)});document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;if(d.goto)navigate(d.goto);if(d.pick){cart[d.pick]=(cart[d.pick]||0)+1;renderSales()}if(d.qty){cart[d.qty]=Math.max(0,(cart[d.qty]||0)+Number(d.delta));renderSales()}if(d.editProduct)productModal(d.editProduct);if(d.editIngredient)ingredientModal(d.editIngredient);if(d.deleteProduct){
 const p=db.products.find(x=>x.id===d.deleteProduct);if(p)confirmDelete({title:'ลบเมนูนี้ไหมคะ?',message:`เมนู “${p.name}” จะถูกนำออกจากรายการขาย แต่ประวัติยอดขายก่อนหน้ายังคงอยู่`,icon:'🧋',acceptText:'ลบเมนู'},()=>{db.products=db.products.filter(x=>x.id!==p.id);delete cart[p.id]});
}if(d.deleteIngredient){
 const ingredient=db.ingredients.find(i=>i.id===d.deleteIngredient);
 if(db.products.some(p=>p.recipe?.[d.deleteIngredient]))return toast('มีเมนูใช้วัตถุดิบนี้อยู่ กรุณาแก้สูตรก่อน');
 if(db.sales.some(s=>s.usage && Object.hasOwn(s.usage,d.deleteIngredient)))return toast('วัตถุดิบนี้อยู่ในประวัติการขาย ต้องเก็บไว้เพื่อคืนสต็อกเมื่อยกเลิกรายการ');
 if(ingredient)confirmDelete({title:'ลบวัตถุดิบนี้ไหมคะ?',message:`จะลบ “${ingredient.name}” ออกจากคลังวัตถุดิบ`,icon:'📦',acceptText:'ลบวัตถุดิบ'},()=>db.ingredients=db.ingredients.filter(i=>i.id!==d.deleteIngredient));
}if(d.deleteSale)deleteSaleWithRestock(d.deleteSale);if(d.deleteExpense){
 const expense=db.expenses.find(x=>x.id===d.deleteExpense);
 if(expense)confirmDelete({title:'ลบค่าใช้จ่ายนี้ไหมคะ?',message:`“${expense.name}” จำนวน ${money(expense.amount)} จะถูกลบ และระบบจะคำนวณกำไรใหม่`,icon:'🧾',acceptText:'ลบค่าใช้จ่าย'},()=>db.expenses=db.expenses.filter(x=>x.id!==d.deleteExpense));
}if(d.question)sendChat(d.question)});
$('#checkout').onclick=checkout;$('#quickSale').onclick=()=>navigate('sales');$('#addProduct').onclick=()=>productModal();$('#addIngredient').onclick=()=>ingredientModal();$('#addExpense').onclick=expenseModal;$('#closeModal').onclick=closeModal;$('#cancelModal').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});$('#modalForm').addEventListener('submit',e=>{e.preventDefault();try{modalHandler(new FormData(e.target));save();closeModal();toast('บันทึกข้อมูลเรียบร้อย')}catch(err){toast(err.message)}});$('#reportRange').onchange=renderReports;$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const q=$('#chatInput').value.trim();if(q)sendChat(q);e.target.reset()});$('#exportBtn').onclick=()=>download(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),'aroi-boba-backup.json');$('#importInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const d=JSON.parse(await file.text());if(!['ingredients','products','sales','expenses'].every(k=>Array.isArray(d[k])))throw Error('รูปแบบไฟล์ไม่ถูกต้อง');askConfirm({title:'แทนที่ข้อมูลร้านทั้งหมด?',message:'การนำเข้าไฟล์นี้จะเขียนทับข้อมูลเมนู สต็อก ประวัติยอดขาย และค่าใช้จ่ายปัจจุบัน แนะนำให้กดสำรองข้อมูล JSON ไว้ก่อน',icon:'📥',acceptText:'ใช่ นำเข้าข้อมูล',cancelText:'ยกเลิกการนำเข้า',details:['ไฟล์ที่เลือก: '+file.name,'จำนวนเมนู: '+d.products.length,'จำนวนรายการขาย: '+d.sales.length]},()=>{db=d;cart={};save();toast('นำเข้าข้อมูลสำเร็จ ♡')})}catch(err){toast(err.message)}finally{e.target.value=''}};$('#exportCsv').onclick=()=>csvDownload('aroi-boba-sales.csv',[['วันที่','รหัส','รายการ','จำนวนแก้ว','รายได้','ต้นทุน'],...db.sales.map(s=>[s.date,s.id,s.items.map(i=>i.name+' x'+i.qty).join(' / '),s.items.reduce((a,i)=>a+i.qty,0),s.total,s.cost])]);$('#reportCsv').onclick=()=>{const {sales,expenses}=reportData(),m=metrics(sales,expenses);csvDownload('aroi-boba-report.csv',[['รายการ','จำนวนเงิน'],['รายได้',m.revenue],['ต้นทุนวัตถุดิบ',m.cogs],['ค่าใช้จ่าย',m.expense],['กำไรประมาณการ',m.profit],['จำนวนแก้ว',m.count]])};window.addEventListener('resize',()=>{if(page==='dashboard')renderChart()});$('#todayText').textContent=dateStr(new Date());render();
