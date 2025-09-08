import{K as k,r as S,j as e,L as R,$ as T,S as g}from"./app-C3ru7wqH.js";import{A}from"./app-layout-D-dBzdAb.js";import{I as P}from"./layout-jdigx-ZW.js";/* empty css            */import"./app-logo-icon-ChnqRbnU.js";import"./index-DjKDmzIj.js";import"./Combination-B9oqp4ei.js";import"./index-Wcro5TXb.js";import"./index-Bg62mNFv.js";function M(){var h,u;const N=k(),{invoice:s,company:r}=N.props,m=(s.status??"unpaid").toString().toLowerCase(),n=t=>Number(t||0).toLocaleString("id-ID"),x=t=>t?new Date(t).toLocaleDateString("id-ID"):"-",v=S.useMemo(()=>(s.order_items??[]).map((t,i)=>{var d;const a=Number(t.price_value??0),l=(t.additional_products??[]).reduce((c,o)=>{var b,j;const p=Number(((b=o.pivot)==null?void 0:b.price_value)??o.price_value??0),_=Number(((j=o.pivot)==null?void 0:j.quantity)??1);return c+p*_},0);return{no:i+1,container:t.container_number,service:(d=t.product)!=null&&d.service_type?`${t.product.service_type} (${t.price_type??"-"})`:t.price_type??"-",main:a,additionals:t.additional_products??[],itemTotal:a+l}}),[s.order_items]),y=()=>{const t=document.getElementById("invoice-content");if(!t)return;const i=window.open("","_blank","width=800,height=600");if(!i){alert("Pop-up diblokir. Mohon izinkan pop-up untuk fitur print.");return}const a=Array.from(document.styleSheets).reduce((d,c)=>{try{const o=c.cssRules?Array.from(c.cssRules).map(p=>p.cssText).join(""):"";return d+`<style>${o}</style>`}catch{return d+`<link rel="stylesheet" href="${c.href}">`}},""),l=t.outerHTML;i.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Invoice ${s.invoice_number}</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${a}
                <style>
                  @media print {
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
                    #invoice-content * {
                      border-color: transparent !important;
                      box-shadow: none !important;
                      background: transparent !important;
                    }
                    #invoice-content table {
                      border: 1px solid #000;
                      border-collapse: collapse;
                    }
                    #invoice-content th, #invoice-content td {
                      border: 1px solid #000;
                      padding: 4px;
                      vertical-align: top;
                    }
                    #invoice-content thead {
                      background-color: #f3f4f6 !important;
                    }
                  }
                </style>
              </head>
              <body>${l}</body>
            </html>
        `),i.document.close(),i.onload=()=>{i.print()}},f=()=>g.put(`/invoices/${s.id}/pay`),w=()=>g.put(`/invoices/${s.id}/unpay`);return e.jsxs(A,{children:[e.jsx(R,{title:"Detail Invoice"}),e.jsxs(P,{children:[e.jsxs("div",{id:"invoice-content",className:"mx-auto max-w-5xl space-y-6 rounded-xl border bg-white p-8 shadow",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"mb-1 text-2xl font-semibold",children:(r==null?void 0:r.name)??"PT. DEPO SURABAYA SEJAHTERA"}),e.jsx("div",{children:(r==null?void 0:r.address)??"Jl. Tanjung Sadari No. 90"}),e.jsx("div",{children:(r==null?void 0:r.phone)??"031-353 9484, 031-3539485"})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-semibold",children:["Periode:"," ",e.jsxs("span",{className:"font-normal",children:[x(s.period_start)," – ",x(s.period_end)]})]}),e.jsxs("div",{className:"font-semibold",children:["Status:"," ",e.jsx("span",{className:m==="paid"?"text-green-600":"text-yellow-500",children:m==="paid"?"Lunas":"Belum Lunas"})]})]})]}),e.jsxs("div",{className:"mt-6",children:[e.jsxs("div",{className:"mb-1",children:[e.jsx("span",{className:"font-bold",children:"Customer:"})," ",((h=s.customer)==null?void 0:h.name)??"-"]}),e.jsxs("div",{className:"mb-1",children:[e.jsx("span",{className:"font-bold",children:"Invoice No:"})," ",s.invoice_number]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("span",{className:"font-bold",children:"No Order/AJU:"})," ",((u=s.order)==null?void 0:u.order_id)??"-"]})]}),e.jsxs("table",{className:"mt-2 mb-4 w-full table-fixed border text-sm",children:[e.jsx("thead",{className:"bg-gray-100",children:e.jsxs("tr",{children:[e.jsx("th",{className:"border px-2 py-1",children:"No"}),e.jsx("th",{className:"border px-2 py-1",children:"Container"}),e.jsx("th",{className:"border px-2 py-1",children:"Service"}),e.jsx("th",{className:"border px-2 py-1",children:"Harga"}),e.jsx("th",{className:"border px-2 py-1",children:"Additional Product"}),e.jsx("th",{className:"border px-2 py-1",children:"Total"})]})}),e.jsx("tbody",{children:v.map(t=>e.jsxs("tr",{children:[e.jsx("td",{className:"border px-2 py-1 text-center",children:t.no}),e.jsx("td",{className:"border px-2 py-1 text-center",children:t.container}),e.jsx("td",{className:"border px-2 py-1 text-center",children:t.service}),e.jsxs("td",{className:"border px-2 py-1 text-right",children:["Rp ",n(t.main)]}),e.jsx("td",{className:"border px-2 py-1",children:t.additionals.length>0?e.jsx("ul",{className:"space-y-0.5",children:t.additionals.map(i=>{var c,o;const a=Number(((c=i.pivot)==null?void 0:c.price_value)??i.price_value??0),l=Number(((o=i.pivot)==null?void 0:o.quantity)??1),d=a*l;return e.jsxs("li",{className:"text-xs leading-tight",children:[e.jsxs("span",{className:"hidden print:hidden",children:[i.service_type??"Produk"," (",e.jsx("span",{className:"font-medium",children:l})," × Rp"," ",n(a)," = ",e.jsxs("strong",{children:["Rp ",n(d)]}),")"]}),e.jsxs("span",{className:"print:hidden",children:[i.service_type," (",l," × Rp ",n(a)," ="," ",e.jsxs("strong",{children:["Rp ",n(d)]}),")"]}),e.jsxs("span",{className:"hidden print:block",children:[i.service_type," (",l," × Rp ",n(a)," = Rp ",n(d),")"]})]},i.id)})}):"-"}),e.jsxs("td",{className:"border px-2 py-1 text-right",children:["Rp ",n(t.itemTotal)]})]},`${t.no}-${t.container}`))})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("table",{className:"text-sm",children:e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"Total sebelum PPN"}),e.jsxs("td",{className:"text-right",children:["Rp ",n(s.subtotal)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"PPN"}),e.jsxs("td",{className:"text-right",children:["Rp ",n(s.ppn)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 text-gray-700",children:"Materai"}),e.jsxs("td",{className:"text-right",children:["Rp ",n(s.materai)]})]}),e.jsxs("tr",{children:[e.jsx("td",{className:"py-1 pr-4 font-bold",children:"Grand Total"}),e.jsxs("td",{className:"text-right font-bold",children:["Rp ",n(s.grand_total)]})]}),s.terbilang&&e.jsx("tr",{children:e.jsxs("td",{colSpan:2,className:"pt-2 text-xs text-gray-500 italic",children:["*** ",s.terbilang," ***"]})})]})})}),e.jsxs("div",{className:"no-break-inside mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between print:flex print:flex-row print:items-end print:justify-between",children:[e.jsxs("div",{className:"w-full rounded-md bg-gray-50 p-4 text-sm md:w-1/2",children:[e.jsxs("div",{className:"font-semibold",children:["Pembayaran ke Rekening ",(r==null?void 0:r.bank_name)??"BCA",":"]}),e.jsx("div",{className:"text-lg tracking-wide",children:(r==null?void 0:r.bank_account)??"463 521 9999"}),e.jsx("div",{className:"mt-1 text-gray-700",children:(r==null?void 0:r.bank_holder)??"Depo Surabaya Sejahtera"})]}),e.jsxs("div",{className:"w-full text-center text-sm md:w-1/2 md:text-right print:text-right",children:[e.jsxs("div",{children:["Surabaya, ",new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(s.period_end))]}),e.jsx("div",{className:"mt-6 h-16 border-t pt-1",style:{border:"none",height:"auto",minHeight:"3rem",marginTop:"0.5rem",marginBottom:"0.5rem",paddingTop:0,paddingBottom:0}}),e.jsx("div",{className:"font-semibold",children:"(PT. Depo Surabaya Sejahtera)"})]})]})]}),e.jsxs("div",{className:"mt-6 flex justify-end gap-3 print:hidden",children:[e.jsx(T,{href:"/invoices",className:"rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50",children:"Kembali"}),e.jsx("button",{onClick:y,className:"rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50",children:"Print"}),m==="unpaid"&&e.jsx("button",{onClick:f,className:"rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700",children:"Tandai Lunas"}),m==="paid"&&e.jsx("button",{onClick:w,className:"rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700",children:"Set Belum Lunas"})]})]})]})}export{M as default};
