import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaCreditCard, FaMoneyBill, FaQrcode, FaTimes, FaCheckCircle, FaSpinner, FaDownload } from 'react-icons/fa';

const PaymentModal = ({ isOpen, onClose, totalPrice, onSuccess, orderId }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const qrisData = {
    merchantId: 'CARI001',
    merchantName: 'CariMakan Resto',
    amount: totalPrice,
    transactionId: `TRX-${Date.now().toString().slice(-8)}`,
    timestamp: new Date().toISOString()
  };

  const generateQRISString = () => {
    return `QRIS|${qrisData.merchantId}|${qrisData.merchantName}|${qrisData.amount}|${qrisData.transactionId}|${qrisData.timestamp}`;
  };

  if (!isOpen) return null;

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess(paymentMethod, orderId);
        onClose();
      }, 1500);
    }, 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qris-code');
    if (svg) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `qris-cari-${qrisData.transactionId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <FaTimes className="text-xl" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">💳 Pembayaran</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total pesanan Anda</p>
          <p className="text-3xl font-bold gradient-text mt-2">{formatRupiah(totalPrice)}</p>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-green-500">Pembayaran Berhasil! 🎉</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Pesanan Anda sedang dimasak</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Pilih Metode Pembayaran</h3>
              
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <FaMoneyBill className={`text-xl ${paymentMethod === 'cash' ? 'text-pink-500' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <p className="text-gray-800 dark:text-white font-medium">Tunai</p>
                  <p className="text-xs text-gray-500">Bayar langsung di tempat</p>
                </div>
                {paymentMethod === 'cash' && (
                  <div className="w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow" />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <FaCreditCard className={`text-xl ${paymentMethod === 'card' ? 'text-pink-500' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <p className="text-gray-800 dark:text-white font-medium">Kartu Kredit/Debit</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, dll</p>
                </div>
                {paymentMethod === 'card' && (
                  <div className="w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow" />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('qris')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <FaQrcode className={`text-xl ${paymentMethod === 'qris' ? 'text-pink-500' : 'text-gray-400'}`} />
                <div className="flex-1 text-left">
                  <p className="text-gray-800 dark:text-white font-medium">QRIS</p>
                  <p className="text-xs text-gray-500">Scan QR Code dengan e-Wallet</p>
                </div>
                {paymentMethod === 'qris' && (
                  <div className="w-4 h-4 rounded-full bg-pink-500 border-2 border-white shadow" />
                )}
              </button>
            </div>

            {paymentMethod === 'qris' && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-xl border-2 border-pink-200 dark:border-pink-800">
                <div className="text-center">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Scan QR Code untuk Membayar
                  </h4>
                  
                  <div className="flex justify-center items-center p-4 bg-white rounded-xl">
                    <QRCodeSVG
                      id="qris-code"
                      value={generateQRISString()}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>💳 Merchant: <span className="font-medium text-gray-700 dark:text-gray-300">{qrisData.merchantName}</span></p>
                    <p>💰 Total: <span className="font-medium text-pink-600 dark:text-pink-400">{formatRupiah(qrisData.amount)}</span></p>
                    <p>🆔 ID Transaksi: <span className="font-medium text-gray-700 dark:text-gray-300">{qrisData.transactionId}</span></p>
                  </div>

                  <button
                    onClick={handleDownloadQR}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-sm mx-auto"
                  >
                    <FaDownload />
                    Download QR Code
                  </button>

                  <div className="mt-4 text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">📱 Cara Bayar dengan QRIS:</p>
                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                      <li>Buka aplikasi e-Wallet (OVO, GoPay, DANA, dll)</li>
                      <li>Pilih menu Scan QR atau Bayar QRIS</li>
                      <li>Scan QR Code di atas</li>
                      <li>Konfirmasi pembayaran</li>
                      <li>Klik tombol "Bayar" di bawah setelah selesai</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full py-3 rounded-xl text-white font-medium transition-all duration-300 ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Memproses...
                </span>
              ) : (
                `Bayar ${formatRupiah(totalPrice)}`
              )}
            </button>

            {paymentMethod !== 'qris' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                Metode: {paymentMethod === 'cash' ? 'Tunai' : 'Kartu Kredit/Debit'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;