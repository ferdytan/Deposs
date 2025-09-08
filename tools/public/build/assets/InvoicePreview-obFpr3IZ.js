import{K as M,r as R,j as e,L as q,$ as z,S as H}from"./app-B98ZThci.js";import{B as f}from"./app-logo-icon-9nhc2994.js";import{A as Q}from"./app-layout-CaDgrDt6.js";import{I as J}from"./layout-lnrh_RVl.js";/* empty css            */import"./index-CI0mzp4r.js";import"./Combination-DTLoTM3Z.js";import"./index-Dbk8gknr.js";import"./index-DlZ-ApHZ.js";function ee(){const I=M(),{preview:N}=I.props,{customer:w,invoice_number:b,order:p,period_start:_,period_end:j,status:P,terbilang:g,company:i}=N,k=t=>t?new Date(t).toLocaleDateString("id-ID"):"-",l=t=>Number(t||0).toLocaleString("id-ID"),[A,T]=R.useState(()=>{var r;const t={};for(const a of p.order_items)for(const d of a.additional_products??[])t[`${a.id}:${d.id}`]=Number(((r=d.pivot)==null?void 0:r.quantity)??1);return t}),$=()=>{const t=document.getElementById("invoice-content");if(!t)return;const r=window.open("","_blank","width=800,height=600");if(!r){alert("Pop-up diblokir. Mohon izinkan pop-up untuk fitur print.");return}const a=Array.from(document.styleSheets).reduce((o,s)=>{try{const n=s.cssRules?Array.from(s.cssRules).map(c=>c.cssText).join(""):"";return o+`<style>${n}</style>`}catch{return o+`<link rel="stylesheet" href="${s.href}">`}},""),d=t.outerHTML;r.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${b}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${a}
        <style>
          /* Reset untuk cetakan */
          body {
            margin: 0;
            padding: 1cm;
            font-size: 10pt;
            color: black;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }

          /* Hilangkan border, shadow, dan tambahan visual yang tidak perlu */
          #invoice-content {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }

          /* Pastikan semua elemen turunannya juga tidak punya border */
          #invoice-content * {
            border-color: transparent !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          /* Kecuali jika ada elemen yang memang butuh border (seperti tabel), tambahkan kembali */
          #invoice-content table {
            border: 1px solid #000;
            border-collapse: collapse;
          }
          #invoice-content th,
          #invoice-content td {
            border: 1px solid #000;
            padding: 4px;
            vertical-align: top;
          }
          #invoice-content thead {
            background-color: #f3f4f6 !important;
          }
        </style>
      </head>
      <body>
        ${d}
      </body>
    </html>
  `),r.document.close(),r.onload=()=>{r.print()}},h=(t,r)=>A[`${t}:${r}`]??1,D=(t,r,a)=>{const d=Number.isFinite(a)&&a>0?Math.floor(a):1;T(o=>({...o,[`${t}:${r}`]:d}))},y=Number(N.materai??0),m=(()=>{var d;let t=0;for(const o of p.order_items){t+=Number(o.price_value??0);for(const s of o.additional_products??[]){const n=Number(((d=s.pivot)==null?void 0:d.price_value)??s.price_value??0),c=h(o.id,s.id);t+=n*c}}const r=Math.round(t*.11),a=t+r+y;return{subtotal:t,ppn:r,grand_total:a}})(),[S,v]=R.useState(!1),C=p.order_items.flatMap(t=>(t.additional_products??[]).map(r=>({order_item_id:t.id,additional_product_id:r.id,quantity:h(t.id,r.id)}))),E={invoice_number:b,customer_id:w.id,order_id:p.id,period_start:_,period_end:j,subtotal:m.subtotal,ppn:m.ppn,materai:y,grand_total:m.grand_total,terbilang:g,order_item_ids:p.order_items.map(t=>t.id),additional_product_quantities:C},B=t=>{t.preventDefault(),v(!0),H.post("/invoices/store",E,{onSuccess:()=>v(!1),onError:()=>v(!1)})};return e.jsxs(Q,{children:[e.jsx(q,{title:"Preview Invoice"}),e.jsx("style",{children:`
                @media print {
                    body { font-size: 10pt; color: black; }
                    .print\\:hidden { display: none !important; }
                    .no-break-inside { break-inside: avoid; }
                    table { width: 100% !important; table-layout: auto; page-break-inside: avoid; }
                    th, td { white-space: normal; word-wrap: break-word; padding: 4px; }
                    .bg-gray-50, .bg-gray-100 { background-color: transparent !important; }
                    .border { border: 1px solid #000 !important; }
                    .h-16 { height: 3rem; }
                    .text-sm { font-size: 9pt; }
                    .text-xs { font-size: 8pt; }
                    .tracking-wide { letter-spacing: normal; }
                    .mt-6, .mb-4, .py-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
                }

                @media screen {
                    .print\\:hidden { display: inherit; }
                }

                .md\\:flex-row { display: flex !important; flex-direction: row !important; }
                .md\\:justify-between { justify-content: space-between !important; }
                .md\\:items-end { align-items: flex-end !important; }
                .w-full { width: 100% !important; }
                .md\\:w-1\\/2 { width: 48% !important; display: inline-block; vertical-align: top; }
                .no-break-inside { break-inside: avoid; page-break-inside: avoid; }
                .payment-and-signature { break-inside: avoid; page-break-inside: avoid; }
            `}),e.jsx(J,{children:e.jsx("form",{onSubmit:B,children:e.jsxs("div",{id:"invoice-content",className:"mx-auto max-w-5xl space-y-6 rounded-xl border bg-white p-8 shadow",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"mb-1 text-2xl font-semibold",children:(i==null?void 0:i.name)??"PT. DEPO SURABAYA SEJAHTERA"}),e.jsx("div",{children:(i==null?void 0:i.address)??"Jl. Tanjung Sadari No. 90"}),e.jsx("div",{children:(i==null?void 0:i.phone)??"031-353 9484, 031-3539485"})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-semibold",children:["Periode:"," ",e.jsxs("span",{className:"font-normal",children:[k(_)," – ",k(j)]})]}),e.jsxs("div",{className:"font-semibold",children:["Status: ",e.jsx("span",{className:"text-yellow-500",children:P})]})]})]}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"mb-1",children:[e.jsx("span",{className:"font-bold",children:"Customer:"})," ",w.name]}),e.jsxs("div",{className:"mb-1",children:[e.jsx("span",{className:"font-bold",children:"Invoice No:"})," ",b]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("span",{className:"font-bold",children:"No Order/AJU:"})," ",p.order_id]})]}),e.jsxs("table",{className:"mt-2 mb-4 w-full table-fixed border text-sm",children:[e.jsx("thead",{className:"bg-gray-100",children:e.jsxs("tr",{children:[e.jsx("th",{className:"border px-2 py-1",children:"No"}),e.jsx("th",{className:"border px-2 py-1",children:"Container"}),e.jsx("th",{className:"border px-2 py-1",children:"Service"}),e.jsx("th",{className:"border px-2 py-1",children:"Harga"}),e.jsx("th",{className:"border px-2 py-1",children:"Additional Product"}),e.jsx("th",{className:"border px-2 py-1",children:"Total"})]})}),e.jsx("tbody",{children:p.order_items.map((t,r)=>{var o;const a=Number(t.price_value??0),d=(t.additional_products??[]).reduce((s,n)=>{var x;const c=Number(((x=n.pivot)==null?void 0:x.price_value)??n.price_value??0),u=h(t.id,n.id);return s+c*u},0);return e.jsxs("tr",{children:[e.jsx("td",{className:"border px-2 py-1 text-center",children:r+1}),e.jsx("td",{className:"border px-2 py-1 text-center",children:t.container_number}),e.jsx("td",{className:"border px-2 py-1 text-center",children:(o=t.product)!=null&&o.service_type?`${t.product.service_type} (${t.price_type??"-"})`:t.price_type??"-"}),e.jsxs("td",{className:"border px-2 py-1 text-right",children:["Rp ",l(a)]}),e.jsx("td",{className:"border px-2 py-1",children:t.additional_products&&t.additional_products.length>0?e.jsx("ul",{className:"space-y-1",children:t.additional_products.map(s=>{var x;const n=Number(((x=s.pivot)==null?void 0:x.price_value)??s.price_value??0),c=h(t.id,s.id),u=n*c;return e.jsxs("li",{className:"text-xs leading-tight",children:[e.jsxs("span",{className:"hidden print:hidden",children:[s.service_type," (",e.jsx("input",{type:"number",min:"1",step:"1",value:c,onChange:L=>D(t.id,s.id,Number(L.target.value)),className:"inline w-12 rounded border px-1 py-0.5 text-center text-xs"})," ","× Rp ",l(n)," = ",e.jsxs("strong",{children:["Rp ",l(u)]}),")"]}),e.jsxs("span",{className:"screen:block hidden print:inline",children:[s.service_type," (",c," × Rp ",l(n)," ="," ",e.jsxs("strong",{children:["Rp ",l(u)]}),")"]})]},s.id)})}):"-"}),e.jsxs("td",{className:"border px-2 py-1 text-right",children:["Rp ",l(a+d)]})]},t.id)})})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("table",{className:"text-sm",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"Total sebelum PPN"}),e.jsxs("td",{className:"text-right",children:["Rp ",l(m.subtotal)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"PPN"}),e.jsxs("td",{className:"text-right",children:["Rp ",l(m.ppn)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"Materai"}),e.jsxs("td",{className:"text-right",children:["Rp ",l(y)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 font-bold",children:"Grand Total"}),e.jsxs("td",{className:"text-right font-bold",children:["Rp ",l(m.grand_total)]})]}),g&&e.jsx("tr",{children:e.jsxs("td",{colSpan:2,className:"pt-2 text-xs text-gray-500 italic",children:["*** ",g," ***"]})})]})})}),e.jsxs("div",{className:"no-break-inside mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between",children:[e.jsxs("div",{className:"w-full rounded-md bg-gray-50 p-4 text-sm md:w-1/2",children:[e.jsxs("div",{className:"font-semibold",children:["Pembayaran ke Rekening ",(i==null?void 0:i.bank_name)??"BCA",":"]}),e.jsx("div",{className:"text-lg tracking-wide",children:(i==null?void 0:i.bank_account)??"463 521 9999"}),e.jsx("div",{className:"mt-1 text-gray-700",children:(i==null?void 0:i.bank_holder)??"Depo Surabaya Sejahtera"})]}),e.jsxs("div",{className:"w-full text-center text-sm md:w-1/2 md:text-right",children:[e.jsxs("div",{children:["Surabaya, ",new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(j))]}),e.jsx("div",{className:"mt-6 h-16 border-t pt-1",style:{border:"none",height:"auto",minHeight:"3rem",marginTop:"0.5rem",marginBottom:"0.5rem",paddingTop:0,paddingBottom:0}}),e.jsx("div",{className:"font-semibold",children:"(PT. Depo Surabaya Sejahtera)"})]})]}),e.jsxs("div",{className:"mt-6 flex justify-end gap-3 print:hidden",children:[e.jsx(f,{asChild:!0,variant:"outline",children:e.jsx(z,{href:"/invoices/create",children:"Kembali"})}),e.jsx(f,{type:"button",variant:"outline",onClick:$,children:"Print"}),e.jsx(f,{type:"submit",disabled:S,children:S?"Menyimpan...":"Simpan Invoice"})]})]})})})]})}export{ee as default};
