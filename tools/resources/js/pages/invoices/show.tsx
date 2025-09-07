import AppLayout from '@/layouts/app-layout';
import InvoicesLayout from '@/layouts/invoices/layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

// ==== Types ====
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

interface InvoicePayload {
    id: number;
    invoice_number: string;
    period_start: string;
    period_end: string;
    subtotal: number;
    ppn: number;
    materai: number;
    grand_total: number;
    terbilang: string;
    status: string;
    customer: Customer;
    order: Order;
    order_items: OrderItem[];
}
type PageProps = { invoice: InvoicePayload; company?: Company };

export default function ShowInvoice() {
    const page = usePage<PageProps>();
    const { invoice, company } = page.props;

    const st = (invoice.status ?? 'unpaid').toString().toLowerCase();
    const rupiah = (n: number) => Number(n || 0).toLocaleString('id-ID');
    const dateID = (d?: string | null) => (d ? new Date(d).toLocaleDateString('id-ID') : '-');

    // Baris tabel
    const rows = useMemo(() => {
        return (invoice.order_items ?? []).map((item, idx) => {
            const main = Number(item.price_value ?? 0);
            const addTotal = (item.additional_products ?? []).reduce((sum, ap) => {
                const price = Number(ap.pivot?.price_value ?? ap.price_value ?? 0);
                const qty = Number(ap.pivot?.quantity ?? 1);
                return sum + price * qty;
            }, 0);
            return {
                no: idx + 1,
                container: item.container_number,
                service: item.product?.service_type ? `${item.product.service_type} (${item.price_type ?? '-'})` : (item.price_type ?? '-'),
                main,
                additionals: item.additional_products ?? [],
                itemTotal: main + addTotal,
            };
        });
    }, [invoice.order_items]);

    // Fungsi cetak hanya invoice
    const printInvoice = () => {
        const printContent = document.getElementById('invoice-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Pop-up diblokir. Mohon izinkan pop-up untuk fitur print.');
            return;
        }

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
                <title>Invoice ${invoice.invoice_number}</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${styles}
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
              <body>${content}</body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            // printWindow.close(); // opsional
        };
    };

    const markAsPaid = () => router.put(`/invoices/${invoice.id}/pay`);
    const markAsUnpaid = () => router.put(`/invoices/${invoice.id}/unpay`);

    return (
        <AppLayout>
            <Head title="Detail Invoice" />

            {/* Kontainer utama invoice */}
            <InvoicesLayout>
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
                                    {dateID(invoice.period_start)} – {dateID(invoice.period_end)}
                                </span>
                            </div>
                            <div className="font-semibold">
                                Status:{' '}
                                <span className={st === 'paid' ? 'text-green-600' : 'text-yellow-500'}>
                                    {st === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Invoice */}
                    <div className="mt-6">
                        <div className="mb-1">
                            <span className="font-bold">Customer:</span> {invoice.customer?.name ?? '-'}
                        </div>
                        <div className="mb-1">
                            <span className="font-bold">Invoice No:</span> {invoice.invoice_number}
                        </div>
                        <div className="mb-3">
                            <span className="font-bold">No Order/AJU:</span> {invoice.order?.order_id ?? '-'}
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
                            {rows.map((r) => (
                                <tr key={`${r.no}-${r.container}`}>
                                    <td className="border px-2 py-1 text-center">{r.no}</td>
                                    <td className="border px-2 py-1 text-center">{r.container}</td>
                                    <td className="border px-2 py-1 text-center">{r.service}</td>
                                    <td className="border px-2 py-1 text-right">Rp {rupiah(r.main)}</td>
                                    <td className="border px-2 py-1">
                                        {r.additionals.length > 0 ? (
                                            <ul className="space-y-0.5">
                                                {r.additionals.map((ap) => {
                                                    const price = Number(ap.pivot?.price_value ?? ap.price_value ?? 0);
                                                    const qty = Number(ap.pivot?.quantity ?? 1);
                                                    const lineTotal = price * qty;
                                                    return (
                                                        <li key={ap.id} className="text-xs leading-tight">
                                                            {/* Layar: tampilkan detail */}
                                                            <span className="hidden print:hidden">
                                                                {ap.service_type ?? 'Produk'} (<span className="font-medium">{qty}</span> × Rp{' '}
                                                                {rupiah(price)} = <strong>Rp {rupiah(lineTotal)}</strong>)
                                                            </span>
                                                            {/* Print: tampilkan tanpa embel-embel */}
                                                            {/* Versi untuk layar (bisa lihat & edit) */}
                                                            <span className="print:hidden">
                                                                {ap.service_type} ({qty} × Rp {rupiah(price)} ={' '}
                                                                <strong>Rp {rupiah(lineTotal)}</strong>)
                                                            </span>

                                                            {/* Versi untuk print (hanya teks, rapi) */}
                                                            <span className="hidden print:block">
                                                                {ap.service_type} ({qty} × Rp {rupiah(price)} = Rp {rupiah(lineTotal)})
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="border px-2 py-1 text-right">Rp {rupiah(r.itemTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Ringkasan Total */}
                    <div className="flex justify-end">
                        <table className="text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1 pr-4 text-gray-700">Total sebelum PPN</td>
                                    <td className="text-right">Rp {rupiah(invoice.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 pr-4 text-gray-700">PPN</td>
                                    <td className="text-right">Rp {rupiah(invoice.ppn)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 pr-4 text-gray-700">Materai</td>
                                    <td className="text-right">Rp {rupiah(invoice.materai)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 pr-4 font-bold">Grand Total</td>
                                    <td className="text-right font-bold">Rp {rupiah(invoice.grand_total)}</td>
                                </tr>
                                {invoice.terbilang && (
                                    <tr>
                                        <td colSpan={2} className="pt-2 text-xs text-gray-500 italic">
                                            *** {invoice.terbilang} ***
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pembayaran & Tanda Tangan */}
                    {/* Pembayaran & Tanda Tangan */}
                    <div className="no-break-inside mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between print:flex print:flex-row print:items-end print:justify-between">
                        {/* Kiri: Pembayaran */}
                        <div className="w-full rounded-md bg-gray-50 p-4 text-sm md:w-1/2">
                            <div className="font-semibold">Pembayaran ke Rekening {company?.bank_name ?? 'BCA'}:</div>
                            <div className="text-lg tracking-wide">{company?.bank_account ?? '463 521 9999'}</div>
                            <div className="mt-1 text-gray-700">{company?.bank_holder ?? 'Depo Surabaya Sejahtera'}</div>
                        </div>

                        {/* Kanan: Tanda Tangan */}
                        <div className="w-full text-center text-sm md:w-1/2 md:text-right print:text-right">
                            <div>
                                Surabaya,&nbsp;
                                {new Intl.DateTimeFormat('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                }).format(new Date(invoice.period_end))}
                            </div>
                            {/* Garis tanda tangan di layar, dihapus saat print */}
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
                </div>

                {/* Tombol Aksi (di luar #invoice-content → tidak ikut cetak) */}
                <div className="mt-6 flex justify-end gap-3 print:hidden">
                    <Link href="/invoices" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                        Kembali
                    </Link>
                    <button onClick={printInvoice} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                        Print
                    </button>
                    {st === 'unpaid' && (
                        <button onClick={markAsPaid} className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                            Tandai Lunas
                        </button>
                    )}
                    {st === 'paid' && (
                        <button onClick={markAsUnpaid} className="rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                            Set Belum Lunas
                        </button>
                    )}
                </div>
            </InvoicesLayout>
        </AppLayout>
    );
}
