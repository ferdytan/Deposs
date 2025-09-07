import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import InvoicesLayout from '@/layouts/invoices/layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

// ==== Types (sama seperti ShowInvoice) ====
interface AdditionalProduct {
    id: number;
    service_type?: string;
    price_value?: number;
    pivot?: { price_value?: number; quantity?: number };
}
interface Product {
    service_type?: string;
}
interface OrderItem {
    id: number;
    container_number: string;
    price_value: number | string;
    price_type?: string;
    product?: Product;
    additional_products?: AdditionalProduct[];
}
interface Order {
    id: number;
    order_id: string;
    order_items: OrderItem[];
}
interface Customer {
    id: number;
    name: string;
}
interface Company {
    name?: string;
    address?: string;
    phone?: string;
    fax?: string;
    bank_name?: string;
    bank_account?: string;
    bank_holder?: string;
}

interface InvoicePreviewProps {
    customer: Customer;
    invoice_number: string;
    order: Order;
    period_start: string;
    period_end: string;
    status: string;
    subtotal: number;
    ppn: number;
    materai: number;
    grand_total: number;
    terbilang: string;
    company?: Company;
}

export default function InvoicePreview() {
    const page = usePage<{ preview: InvoicePreviewProps }>();
    const { preview } = page.props;
    const { customer, invoice_number, order, period_start, period_end, status, terbilang, company } = preview;

    const dateID = (d?: string | null) => (d ? new Date(d).toLocaleDateString('id-ID') : '-');
    const rupiah = (n: number) => Number(n || 0).toLocaleString('id-ID');

    // --- State Qty untuk Additional Products ---
    const [addQty, setAddQty] = useState<Record<string, number>>(() => {
        const m: Record<string, number> = {};
        for (const item of order.order_items) {
            for (const ap of item.additional_products ?? []) {
                m[`${item.id}:${ap.id}`] = Number(ap.pivot?.quantity ?? 1);
            }
        }
        return m;
    });
    const printInvoice = () => {
        const printContent = document.getElementById('invoice-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Pop-up diblokir. Mohon izinkan pop-up untuk fitur print.');
            return;
        }

        // Salin style dari halaman asli (opsional, bisa diskip jika tidak perlu)
        const styles = Array.from(document.styleSheets).reduce((acc, sheet) => {
            try {
                const rules = sheet.cssRules
                    ? Array.from(sheet.cssRules)
                          .map((r) => r.cssText)
                          .join('')
                    : '';
                return acc + `<style>${rules}</style>`;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return acc + `<link rel="stylesheet" href="${sheet.href}">`;
            }
        }, '');

        const content = printContent.outerHTML;

        printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice ${invoice_number}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${styles}
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
        ${content}
      </body>
    </html>
  `);

        printWindow.document.close();

        printWindow.onload = () => {
            printWindow.print();
            // printWindow.close(); // opsional: uncomment jika ingin otomatis tutup
        };
    };

    const getQty = (itemId: number, prodId: number) => addQty[`${itemId}:${prodId}`] ?? 1;
    const setQty = (itemId: number, prodId: number, val: number) => {
        const v = Number.isFinite(val) && val > 0 ? Math.floor(val) : 1;
        setAddQty((prev) => ({ ...prev, [`${itemId}:${prodId}`]: v }));
    };

    // --- Hitung ulang total berdasarkan qty terbaru ---
    const materai = Number(preview.materai ?? 0);
    const calc = () => {
        let subtotal = 0;
        for (const item of order.order_items) {
            subtotal += Number(item.price_value ?? 0);
            for (const ap of item.additional_products ?? []) {
                const price = Number(ap.pivot?.price_value ?? ap.price_value ?? 0);
                const qty = getQty(item.id, ap.id);
                subtotal += price * qty;
            }
        }
        const ppn = Math.round(subtotal * 0.11);
        const grand_total = subtotal + ppn + materai;
        return { subtotal, ppn, grand_total };
    };
    const totals = calc();

    const [isSaving, setIsSaving] = useState(false);

    const additionalSelections = order.order_items.flatMap((item) =>
        (item.additional_products ?? []).map((ap) => ({
            order_item_id: item.id,
            additional_product_id: ap.id,
            quantity: getQty(item.id, ap.id),
        })),
    );

    const formData = {
        invoice_number,
        customer_id: customer.id,
        order_id: order.id,
        period_start,
        period_end,
        subtotal: totals.subtotal,
        ppn: totals.ppn,
        materai,
        grand_total: totals.grand_total,
        terbilang,
        order_item_ids: order.order_items.map((item) => item.id),
        additional_product_quantities: additionalSelections,
    };

    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        router.post('/invoices/store', formData, {
            onSuccess: () => setIsSaving(false),
            onError: () => setIsSaving(false),
        });
    };

    return (
        <AppLayout>
            <Head title="Preview Invoice" />

            <style>{`
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
            `}</style>

            <InvoicesLayout>
                <form onSubmit={handleSaveInvoice}>
                    <div id="invoice-content" className="mx-auto max-w-5xl space-y-6 rounded-xl border bg-white p-8 shadow">
                        {/* Header Perusahaan */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="mb-1 text-2xl font-semibold">{company?.name ?? 'PT. DEPO SURABAYA SEJAHTERA'}</h2>
                                <div>{company?.address ?? 'Jl. Tanjung Sadari No. 90'}</div>
                                <div>{company?.phone ?? '031-353 9484, 031-3539485'}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">
                                    Periode:{' '}
                                    <span className="font-normal">
                                        {dateID(period_start)} – {dateID(period_end)}
                                    </span>
                                </div>
                                <div className="font-semibold">
                                    Status: <span className="text-yellow-500">{status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Informasi Invoice */}
                        <div className="mt-6">
                            <div className="mb-1">
                                <span className="font-bold">Customer:</span> {customer.name}
                            </div>
                            <div className="mb-1">
                                <span className="font-bold">Invoice No:</span> {invoice_number}
                            </div>
                            <div className="mb-3">
                                <span className="font-bold">No Order/AJU:</span> {order.order_id}
                            </div>
                        </div>

                        {/* Tabel Item */}
                        <table className="mt-2 mb-4 w-full table-fixed border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-2 py-1">No</th>
                                    <th className="border px-2 py-1">Container</th>
                                    <th className="border px-2 py-1">Service</th>
                                    <th className="border px-2 py-1">Harga</th>
                                    <th className="border px-2 py-1">Additional Product</th>
                                    <th className="border px-2 py-1">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items.map((item, idx) => {
                                    const main = Number(item.price_value ?? 0);
                                    const addTotal = (item.additional_products ?? []).reduce((sum, ap) => {
                                        const price = Number(ap.pivot?.price_value ?? ap.price_value ?? 0);
                                        const qty = getQty(item.id, ap.id);
                                        return sum + price * qty;
                                    }, 0);
                                    return (
                                        <tr key={item.id}>
                                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                                            <td className="border px-2 py-1 text-center">{item.container_number}</td>
                                            <td className="border px-2 py-1 text-center">
                                                {item.product?.service_type
                                                    ? `${item.product.service_type} (${item.price_type ?? '-'})`
                                                    : (item.price_type ?? '-')}
                                            </td>
                                            <td className="border px-2 py-1 text-right">Rp {rupiah(main)}</td>
                                            <td className="border px-2 py-1">
                                                {item.additional_products && item.additional_products.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {item.additional_products.map((ap) => {
                                                            const price = Number(ap.pivot?.price_value ?? ap.price_value ?? 0);
                                                            const qty = getQty(item.id, ap.id);
                                                            const lineTotal = price * qty;

                                                            return (
                                                                <li key={ap.id} className="text-xs leading-tight">
                                                                    {/* Tampilan untuk layar (bisa edit) */}
                                                                    <span className="hidden print:hidden">
                                                                        {ap.service_type} (
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            step="1"
                                                                            value={qty}
                                                                            onChange={(e) => setQty(item.id, ap.id, Number(e.target.value))}
                                                                            className="inline w-12 rounded border px-1 py-0.5 text-center text-xs"
                                                                        />{' '}
                                                                        × Rp {rupiah(price)} = <strong>Rp {rupiah(lineTotal)}</strong>)
                                                                    </span>

                                                                    {/* Tampilan untuk print (hanya teks) */}
                                                                    <span className="screen:block hidden print:inline">
                                                                        {ap.service_type} ({qty} × Rp {rupiah(price)} ={' '}
                                                                        <strong>Rp {rupiah(lineTotal)}</strong>)
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="border px-2 py-1 text-right">Rp {rupiah(main + addTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Ringkasan Total (kanan) */}
                        <div className="flex justify-end">
                            <table className="text-sm">
                                <tbody>
                                    <tr>
                                        <td className="py-1 pr-4 text-gray-700">Total sebelum PPN</td>
                                        <td className="text-right">Rp {rupiah(totals.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 text-gray-700">PPN</td>
                                        <td className="text-right">Rp {rupiah(totals.ppn)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 text-gray-700">Materai</td>
                                        <td className="text-right">Rp {rupiah(materai)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1 pr-4 font-bold">Grand Total</td>
                                        <td className="text-right font-bold">Rp {rupiah(totals.grand_total)}</td>
                                    </tr>
                                    {terbilang && (
                                        <tr>
                                            <td colSpan={2} className="pt-2 text-xs text-gray-500 italic">
                                                *** {terbilang} ***
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pembayaran & Tanda Tangan */}
                        <div className="no-break-inside mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                            {/* Kiri: Pembayaran */}
                            <div className="w-full rounded-md bg-gray-50 p-4 text-sm md:w-1/2">
                                <div className="font-semibold">Pembayaran ke Rekening {company?.bank_name ?? 'BCA'}:</div>
                                <div className="text-lg tracking-wide">{company?.bank_account ?? '463 521 9999'}</div>
                                <div className="mt-1 text-gray-700">{company?.bank_holder ?? 'Depo Surabaya Sejahtera'}</div>
                            </div>

                            {/* Kanan: Tanda Tangan */}
                            <div className="w-full text-center text-sm md:w-1/2 md:text-right">
                                <div>
                                    Surabaya,&nbsp;
                                    {new Intl.DateTimeFormat('id-ID', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    }).format(new Date(period_end))}
                                </div>
                                <div
                                    className="mt-6 h-16 border-t pt-1"
                                    style={{
                                        border: 'none',
                                        height: 'auto',
                                        minHeight: '3rem', // Beri ruang minimal
                                        marginTop: '0.5rem', // Jarak atas
                                        marginBottom: '0.5rem', // Jarak bawah
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                    }}
                                ></div>
                                <div className="font-semibold">(PT. Depo Surabaya Sejahtera)</div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="mt-6 flex justify-end gap-3 print:hidden">
                            <Button asChild variant="outline">
                                <Link href="/invoices/create">Kembali</Link>
                            </Button>
                            <Button type="button" variant="outline" onClick={printInvoice}>
                                Print
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Menyimpan...' : 'Simpan Invoice'}
                            </Button>
                        </div>
                    </div>
                </form>
            </InvoicesLayout>
        </AppLayout>
    );
}
