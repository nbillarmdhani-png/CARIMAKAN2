import { useRef } from 'react';
import { FaTimes, FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StrukModal = ({ isOpen, onClose, order }) => {
  const strukRef = useRef();

  if (!isOpen || !order) return null;

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== HITUNG TOTAL ITEM =====
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // ===== CEK APAKAH ADA VOUCHER =====
  const hasVoucher = order.voucherCode && order.voucherDiscount && order.voucherDiscount > 0;

  const handlePrint = () => {
    const printContents = strukRef.current.innerHTML;
    document.body.innerHTML = `
      <html>
        <head>
          <title>Struk Pesanan - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
            .struk { background: white; padding: 20px; border: 1px dashed #ccc; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 24px; margin: 0; color: #ec4899; }
            .header p { font-size: 12px; color: #666; margin: 5px 0; }
            .items { margin: 15px 0; }
            .item { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; border-bottom: 1px dotted #ddd; }
            .item-name { flex: 1; }
            .item-qty { margin: 0 10px; color: #666; }
            .item-price { font-weight: bold; }
            .total { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .voucher-row { display: flex; justify-content: space-between; font-size: 14px; color: #22c55e; padding: 4px 0; border-bottom: 1px dotted #ddd; }
            .footer { text-align: center; border-top: 2px dashed #000; padding-top: 10px; margin-top: 15px; font-size: 12px; color: #666; }
            .info-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
            .thankyou { text-align: center; font-size: 16px; font-weight: bold; color: #ec4899; margin: 10px 0; }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `;
    document.close();
  };

  const handleDownloadPDF = async () => {
    const element = strukRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`struk-${order.orderNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header Modal */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end rounded-t-2xl z-10">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content - Struk */}
        <div className="p-4">
          <div
            ref={strukRef}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 font-mono text-sm"
          >
            {/* Header Struk */}
            <div className="text-center border-b-2 border-dashed border-gray-300 dark:border-gray-600 pb-4">
              <h1 className="text-2xl font-bold text-pink-500">🍽️ CariMakan</h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Jl. Kuliner Nusantara No. 1</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Telp: (021) 1234-5678</p>
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>No. Order: <span className="font-bold text-gray-700 dark:text-gray-300">{order.orderNumber}</span></span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.deliveryAddress && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  📍 {order.deliveryAddress}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-4 space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700 pb-1">
                <span>Item</span>
                <span>Qty</span>
                <span>Harga</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-dotted border-gray-200 dark:border-gray-700">
                  <span className="text-gray-800 dark:text-gray-200 flex-1">{item.name}</span>
                  <span className="text-gray-500 dark:text-gray-400 mx-4">{item.quantity}x</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* ===== SUBTOTAL ===== */}
            <div className="flex justify-between text-sm py-1 border-t border-gray-300 dark:border-gray-600 pt-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{formatRupiah(subtotal)}</span>
            </div>

            {/* ===== VOUCHER DISCOUNT - DI SINI LETAKNYA ===== */}
            {hasVoucher && (
              <div className="flex justify-between text-sm py-1 text-green-600 dark:text-green-400 border-b border-dotted border-green-200 dark:border-green-800">
                <span>🎫 Voucher {order.voucherCode}</span>
                <span>- {formatRupiah(order.voucherDiscount)}</span>
              </div>
            )}

            {/* ===== TOTAL ===== */}
            <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800 dark:text-gray-200">Total</span>
                <span className="text-pink-500">{formatRupiah(order.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Metode Pembayaran</span>
                <span className="font-medium text-green-500">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Status</span>
                <span className="font-medium text-purple-500">✅ Selesai</span>
              </div>
              {hasVoucher && (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Voucher</span>
                  <span className="font-medium text-green-500">{order.voucherCode}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4 mt-4">
              <p className="text-lg font-bold text-pink-500">✨ Terima Kasih! ✨</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Selamat menikmati makanan Anda!</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                ⏰ {new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4 no-print">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-medium"
            >
              <FaArrowLeft />
              Kembali
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-medium"
            >
              <FaPrint />
              Cetak 🖨️
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-medium"
            >
              <FaDownload />
              PDF 📄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrukModal;