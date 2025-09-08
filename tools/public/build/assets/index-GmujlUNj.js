import{r as p,K as pe,j as e,L as ge,S as _,$ as xe}from"./app-B98ZThci.js";import{A as fe,X as je}from"./app-layout-CaDgrDt6.js";import{O as ye}from"./layout-C0JkhWSe.js";import{D as be,a as we,b as ve,c as Se,d as Ne}from"./dialog-CG3VtMxx.js";import{H as Ce}from"./heading-BNsMVixI.js";import{a as _e,B as b}from"./app-logo-icon-9nhc2994.js";import{I as M}from"./input-DiaRsZww.js";import{L as S}from"./label-DlFk4KKB.js";import{T as Le,a as Te,b as F,c as g,d as ke,e as u}from"./table-CGDbsOrl.js";import{C as De}from"./circle-plus-CCbOQ91C.js";import{A as $e,a as Pe,b as Ae}from"./arrow-up-DtF7Mi4E.js";/* empty css            */import"./index-CI0mzp4r.js";import"./Combination-DTLoTM3Z.js";import"./index-Dbk8gknr.js";import"./index-DlZ-ApHZ.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],Me=_e("Printer",Oe),Fe=[{title:"Order Management",href:"/orders"}];function et({orders:w,customers:Q,filters:Z}){var I;const l=Z||{},[o,ee]=p.useState((l==null?void 0:l.search)??""),[x,te]=p.useState(l.customer??""),[ae,L]=p.useState(!1),[E,se]=p.useState(null),[T,v]=p.useState([]),[d,re]=p.useState(""),[h,ne]=p.useState(""),R=w.data.filter(t=>{var i,n,f,j,y;const a=((n=(i=t.order)==null?void 0:i.customer)==null?void 0:n.name)??"",s=((j=(f=t.order)==null?void 0:f.shipper)==null?void 0:j.name)??"",r=((y=t.product)==null?void 0:y.service_type)??"",c=t.container_number??"";return(!o||a.toLowerCase().includes(o.toLowerCase())||s.toLowerCase().includes(o.toLowerCase())||r.toLowerCase().includes(o.toLowerCase())||c.toLowerCase().includes(o.toLowerCase()))&&(!x||a===x)&&(!d&&!h?!0:[t.entry_date,t.eir_date,t.exit_date].some(C=>{if(!C)return!1;const P=new Date(C),Y=(P.getMonth()+1).toString().padStart(2,"0"),H=P.getFullYear().toString();return(!d||Y===d)&&(!h||H===h)}))}),oe=(t,a)=>{v(s=>{const r=[...s];return r[t].date=a,r})},ie=(t,a,s)=>{v(r=>{const c=[...r];return c[t].temps={...c[t].temps||{},[a.toString().padStart(2,"0")]:s},c})},le=()=>{v(t=>[...t,{date:"",temps:{}}])},ce=t=>{v(a=>a.filter((s,r)=>r!==t))},de=()=>{if(!E)return;const t={};T.forEach(a=>{a.date&&(t[a.date]=a.temps)}),console.log("Data yang dikirim ke backend:",t),_.patch(route("orders.update-temperature",E.id),{temperature:t},{onSuccess:()=>{L(!1),se(null),v([]),_.reload({only:["orders"]})},onError:a=>{alert("Terjadi error saat menyimpan data suhu."),console.error(a)}})};p.useEffect(()=>{console.log("Semua data orders:",w.data)},[w.data]);const me=()=>{const t=w.data.filter(i=>{var A,O,U,W,q,G,J;const n=((O=(A=i.order)==null?void 0:A.customer)==null?void 0:O.name)??"",f=((W=(U=i.order)==null?void 0:U.shipper)==null?void 0:W.name)??"",j=((q=i.product)==null?void 0:q.service_type)??"",y=i.container_number??"",z=((G=i.order)==null?void 0:G.no_aju)??"",C=((J=i.order)==null?void 0:J.order_id)??"";return(!o||n.toLowerCase().includes(o.toLowerCase())||f.toLowerCase().includes(o.toLowerCase())||j.toLowerCase().includes(o.toLowerCase())||y.toLowerCase().includes(o.toLowerCase())||z.toLowerCase().includes(o.toLowerCase())||C.toLowerCase().includes(o.toLowerCase()))&&(!x||n===x)&&(!d&&!h?!0:[i.entry_date,i.eir_date,i.exit_date].some(V=>{if(!V)return!1;const X=new Date(V),ue=(X.getMonth()+1).toString().padStart(2,"0"),he=X.getFullYear().toString();return(!d||ue===d)&&(!h||he===h)}))});if(t.length===0){alert("Tidak ada data yang sesuai filter untuk dicetak.");return}const r=`${d?new Date(2024,parseInt(d)-1).toLocaleString("id-ID",{month:"long"}):"Semua Bulan"} ${h||"Semua Tahun"}`,c=x?`Customer: ${x}`:"Semua Customer",$="/logo.png",N=new Image;N.src=$;const m=window.open("","_blank");if(!m){alert("Gagal membuka jendela cetak. Pastikan popup tidak diblokir.");return}m.document.write(`
        <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
            Memuat logo...
        </div>
    `),m.document.close(),N.onload=()=>{const i=`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Billing Statement</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .logo {
                        width: 70px;
                        height: 70px;
                    }
                    .company-info {
                        font-size: 14px;
                    }
                    .company-info strong {
                        font-size: 16px;
                    }
                    .customer-info {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: 600;
                    }
                    .text-gray-400 {
                        color: #9ca3af;
                    }
                    .bg-yellow-100 {
                        background-color: #fef3c7;
                        padding: 4px 6px;
                        border-radius: 4px;
                        font-size: 11px;
                    }
                    .text-yellow-800 {
                        color: #854d0e;
                    }
                    @media print {
                        @page {
                            margin: 1cm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${$}" alt="Logo" class="logo">
                    <div class="company-info">
                        <strong>PT. DEPO SUBARAYA SEJAHTERA</strong><br>
                        Tanjung Sadari No. 90<br>
                        Surabaya<br>
                        Jawa Timur - Indonesia
                    </div>
                </div>

                <div class="customer-info">
                    <strong>${c}</strong><br>
                    <strong>Periode:</strong> ${r}<br>
                  
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nomor Kontainer</th>
                            <th>Nama Shipper</th>
                            <th>Size</th>
                            <th>Tanggal Masuk</th>
                            <th>Tanggal EIR</th>
                            <th>Tanggal Keluar</th>
                            <th>Komoditi</th>
                            <th>Fumigator</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(n=>{var f,j,y;return`
                            <tr>
                                <td>${n.container_number}</td>
                                <td>${((j=(f=n.order)==null?void 0:f.shipper)==null?void 0:j.name)??"-"}</td>
                                <td>${n.price_type??"-"}</td>
                                <td>${n.entry_date?new Date(n.entry_date).toLocaleString("id-ID"):'<span class="text-gray-400">–</span>'}</td>
                                <td>${n.eir_date?new Date(n.eir_date).toLocaleString("id-ID"):'<span class="text-gray-400">–</span>'}</td>
                                <td>${n.exit_date?new Date(n.exit_date).toLocaleString("id-ID"):'<span class="text-gray-400">–</span>'}</td>
                                <td>${n.commodity??"-"}</td>
                                <td>
    ${(y=n.order)!=null&&y.fumigasi?n.order.fumigasi.length>50?n.order.fumigasi.substring(0,50)+"...":n.order.fumigasi:"–"}
</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>

            </body>
            </html>
        `;m.document.write(i),m.document.close(),m.focus(),setTimeout(()=>m.print(),300)},N.onerror=()=>{alert("Gagal memuat logo. Pastikan file /logo.png ada di folder public."),m.close()}},{props:B}=pe(),K=()=>{const a=window.location.pathname.startsWith("/karantina")?"/karantina":"/orders";_.get(a,{search:o,trashed:l.trashed})},k=({label:t,field:a,currentSort:s,currentDir:r})=>{const c=s===a&&r==="asc"?"desc":"asc";return e.jsxs(xe,{href:route("orders.index",{sort_by:a,sort_dir:c,trashed:l.trashed,search:l.search}),className:"flex items-center gap-1 font-semibold text-gray-700 hover:text-black",children:[t,s===a?c==="asc"?e.jsx($e,{className:"h-4 w-4"}):e.jsx(Pe,{className:"h-4 w-4"}):e.jsx(Ae,{className:"h-4 w-4 text-gray-400"})]})},D={};for(const t of w.data){const a=t.no_aju??t.order_id;D[a]||(D[a]=[]),D[a].push(t)}return e.jsxs(fe,{breadcrumbs:Fe,children:[e.jsx(ge,{title:"Order Management"}),e.jsxs(ye,{children:[e.jsxs("div",{className:"space-y-6",children:[((I=B.flash)==null?void 0:I.success)&&e.jsx("div",{className:"rounded-md bg-green-50 p-4 text-sm text-green-700",children:B.flash.success}),e.jsx(Ce,{title:"Order List",description:"Manage all registered orders and their statuses."}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(S,{htmlFor:"search",children:"Search"}),e.jsxs("div",{className:"flex flex-col gap-2 sm:flex-row",children:[e.jsx(M,{id:"search",placeholder:"Search by customer, product, or container",value:o,onChange:t=>ee(t.target.value),onKeyUp:t=>t.key==="Enter"&&K(),className:"flex-1"}),e.jsx(b,{onClick:K,className:"w-full sm:w-auto",children:"Search"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(S,{htmlFor:"customer-filter",children:"Filter Customer"}),e.jsxs("select",{value:x,onChange:t=>te(t.target.value),children:[e.jsx("option",{value:"",children:"Semua Customer"}),Q.map(t=>e.jsx("option",{value:t.name,children:t.name},t.id))]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(S,{children:"Filter Periode"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("select",{value:d,onChange:t=>re(t.target.value),className:"rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",children:[e.jsx("option",{value:"",children:"Semua Bulan"}),Array.from({length:12},(t,a)=>{const s=(a+1).toString().padStart(2,"0");return e.jsx("option",{value:s,children:new Date(2024,a).toLocaleString("id-ID",{month:"long"})},s)})]}),e.jsxs("select",{value:h,onChange:t=>ne(t.target.value),className:"rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",children:[e.jsx("option",{value:"",children:"Semua Tahun"}),Array.from({length:15},(t,a)=>{const s=(2020+a).toString();return e.jsx("option",{value:s,children:s},s)})]})]})]}),e.jsx("div",{className:"space-y-2",children:e.jsxs(b,{onClick:me,className:"mb-2",children:[e.jsx(Me,{className:"mr-2 h-4 w-4"}),"Cetak Billing Statement"]})}),e.jsx("div",{className:"flex justify-end"}),e.jsxs("div",{className:"w-full rounded-md border",children:[e.jsx("div",{className:"overflow-x-auto",style:{maxWidth:"100vw"}}),e.jsxs(Le,{children:[e.jsx(Te,{children:e.jsxs(F,{children:[e.jsx(g,{children:e.jsx(k,{label:"Nomor Kontainer",field:"container_number",currentSort:l.sort_by,currentDir:l.sort_dir})}),e.jsx(g,{children:e.jsx(k,{label:"Nama Shipper",field:"shippers.name",currentSort:l.sort_by,currentDir:l.sort_dir})}),e.jsx(g,{children:"Size"}),e.jsx(g,{children:"Tanggal Masuk"}),e.jsx(g,{children:"Tanggal EIR"}),e.jsx(g,{children:"Tanggal Keluar"}),e.jsx(g,{children:"Komoditi"}),e.jsx(g,{children:e.jsx(k,{label:"Fumigasi",field:"fumigasi",currentSort:l.sort_by,currentDir:l.sort_dir})})]})}),e.jsx(ke,{children:R.length===0?e.jsx(F,{children:e.jsx(u,{className:"py-8 text-center text-sm text-muted-foreground",children:"Tidak ada data yang sesuai filter."})}):R.map(t=>{var a,s,r;return e.jsxs(F,{className:"group",children:[e.jsx(u,{className:"py-3",children:t.container_number}),e.jsx(u,{className:"py-3",children:((s=(a=t.order)==null?void 0:a.shipper)==null?void 0:s.name)??"-"}),e.jsx(u,{className:"py-3",children:t.price_type??"-"}),e.jsx(u,{className:"py-3",children:t.entry_date?new Date(t.entry_date).toLocaleString():e.jsx("span",{children:"-"})}),e.jsx(u,{className:"py-3",children:t.eir_date?new Date(t.eir_date).toLocaleString():e.jsx("span",{children:"-"})}),e.jsx(u,{className:"py-3",children:t.exit_date?new Date(t.exit_date).toLocaleString():e.jsx("span",{children:"-"})}),e.jsx(u,{className:"py-3",children:t.commodity??"-"}),e.jsx(u,{className:"py-3",children:(r=t.order)!=null&&r.fumigasi?e.jsx("span",{className:"rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800",children:t.order.fumigasi.length>50?`${t.order.fumigasi.substring(0,50)}...`:t.order.fumigasi}):e.jsx("span",{className:"text-gray-400",children:"–"})})]},t.id)})})]})]})]}),e.jsx("div",{className:"flex flex-wrap justify-center gap-1",children:w.links.map((t,a)=>t.url?e.jsx(b,{variant:t.active?"default":"outline",disabled:!t.url,onClick:()=>_.get(t.url),className:"px-3 py-1 whitespace-nowrap",children:t.label.replace(/&laquo; Previous|Next &raquo;/,s=>s.includes("Previous")?"← Prev":s.includes("Next")?"Next →":s)},a):e.jsx("span",{className:"px-3 py-1",children:"..."},a))}),e.jsx(be,{open:ae,onOpenChange:L,children:e.jsxs(we,{className:"max-w-3xl",children:[e.jsx(ve,{children:e.jsx(Se,{children:"Rekam Suhu Kontainer"})}),e.jsxs("div",{className:"max-h-[60vh] space-y-6 overflow-y-auto pr-2",children:[T.map((t,a)=>e.jsxs("div",{className:"space-y-2 rounded border p-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(S,{htmlFor:`date_${a}`,children:"Tanggal"}),e.jsx(M,{id:`date_${a}`,type:"date",value:t.date,onChange:s=>oe(a,s.target.value),className:"max-w-[180px]"}),T.length>1&&e.jsx(b,{type:"button",size:"icon",variant:"destructive",className:"ml-auto",onClick:()=>ce(a),children:e.jsx(je,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"grid max-h-64 grid-cols-2 gap-2 overflow-y-auto",children:[...Array(24)].map((s,r)=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(S,{htmlFor:`temp_${a}_${r}`,children:[r.toString().padStart(2,"0"),":00"]}),e.jsx(M,{id:`temp_${a}_${r}`,type:"number",step:"0.1",value:t.temps[r.toString().padStart(2,"0")]||"",onChange:c=>ie(a,r,c.target.value),className:"w-24"})]},r))})]},a)),e.jsxs(b,{type:"button",variant:"outline",onClick:le,className:"flex items-center gap-2",children:[e.jsx(De,{className:"h-4 w-4"})," Tambah Tanggal"]})]}),e.jsxs(Ne,{className:"gap-2",children:[e.jsx(b,{variant:"outline",onClick:()=>L(!1),children:"Batal"}),e.jsx(b,{onClick:de,children:"Simpan"})]})]})})]})]})}export{et as default};
