// ThermalPrintableBill.jsx
import React from 'react';

const ThermalPrintableBill = ({ billData = {}, companyDetails = {} }) => {
  // Format currency without ₹ symbol
  const formatCurrency = (amount) => {
    const roundedAmount = Math.round((amount || 0) * 100) / 100;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(roundedAmount);
  };

  // Calculate totals
  const calculateTotals = () => {
    const products = billData.products || [];
    let subtotal = 0;
    let gstTotal = 0;
    let sgstTotal = 0;

    if (products.length > 0) {
      subtotal = products.reduce((sum, product) => {
        const price = (product.basicPrice || 0);
        const qty = product.quantity || 1;
        return sum + (price * qty);
      }, 0);

      gstTotal = products.reduce((sum, product) => {
        const tax = (product.gstAmount || 0);
        const qty = product.quantity || 1;
        return sum + (tax * qty);
      }, 0);

      sgstTotal = products.reduce((sum, product) => {
        const tax = (product.sgstAmount || 0);
        const qty = product.quantity || 1;
        return sum + (tax * qty);
      }, 0);
    }

    const transport = (billData.transportCharge || 0);
    const credit = (billData.previousOutstandingCredit || 0);
    const grandTotal = (subtotal + gstTotal + sgstTotal + transport + credit);

    // Payment details
    const payment = billData.payment || {};
    const currentPayment = payment.currentBillPayment || 0;
    const outstandingPayment = payment.selectedOutstandingPayment || 0;
    const totalPaid = currentPayment + outstandingPayment;
    const balanceDue = Math.max(0, grandTotal - totalPaid);

    return {
      subtotal,
      gstTotal,
      sgstTotal,
      transport,
      credit,
      grandTotal,
      currentPayment,
      outstandingPayment,
      totalPaid,
      balanceDue,
      hasProducts: products.length > 0
    };
  };

  const totals = calculateTotals();

  return (
    <div style={{
      width: '80mm',
      margin: '0 auto',
      padding: '2mm',
      fontSize: '10px',
      fontFamily: "'Courier New', monospace",
      lineHeight: '1.2'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        {companyDetails.logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={companyDetails.logoUrl}
              alt="Company Logo"
              style={{
                height: '20px',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
          {companyDetails.businessName || 'Business Name'}
        </div>
        <div>{companyDetails.address || 'Business Address'}</div>
        <div>GSTIN: {companyDetails.gstin || 'N/A'}</div>
      </div>

      {/* Bill Info */}
      <div style={{ marginBottom: '3mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Bill No: {billData.billNumber || 'N/A'}</span>
          <span>Date: {new Date(billData.date || new Date()).toLocaleDateString('en-IN')}</span>
        </div>
        <div>Customer: {billData.customer?.name || 'Walk-in Customer'}</div>
        <div>Phone: {billData.customer?.contact || 'N/A'}</div>
        <div>Cashier Name: {billData.cashier?.cashierName}</div>
      </div>

      {/* Products Table */}
      {totals.hasProducts && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #000', padding: '1mm', textAlign: 'left', fontSize: '11px' }}>Item</th>
              <th style={{ borderBottom: '1px solid #000', padding: '1mm', textAlign: 'left', fontSize: '11px' }}>Qty</th>
              <th style={{ borderBottom: '1px solid #000', padding: '1mm', textAlign: 'right', fontSize: '11px' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {billData.products.map((product, index) => (
              <tr key={index}>
                <td style={{ borderBottom: '1px solid #ddd', padding: '1mm', fontSize: '11px' }}>{product.name}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '1mm', textAlign: 'left', fontSize: '11px' }}>
                  {product.quantity} {product.unit}
                </td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '1mm', textAlign: 'right', fontSize: '11px' }}>
                  {formatCurrency(product.basicPrice * product.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div style={{ marginBottom: '3mm' }}>
        {totals.hasProducts && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CGST:</span>
              <span>{formatCurrency(totals.gstTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SGST:</span>
              <span>{formatCurrency(totals.sgstTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Transport:</span>
              <span>{formatCurrency(totals.transport)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Previous Credit:</span>
          <span>{formatCurrency(totals.credit)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Grand Total:</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>

      {/* Payment Details */}
      {billData.payment && (
        <div style={{ marginBottom: '3mm', borderTop: '1px dashed #000', paddingTop: '2mm' }}>
          {!billData.isOutstandingPaymentOnly && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Current Bill Payment:</span>
              <span>{formatCurrency(totals.currentPayment)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Credit Payment:</span>
            <span>{formatCurrency(totals.outstandingPayment)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Paid:</span>
            <span>{formatCurrency(totals.totalPaid)}</span>
          </div>
          {totals.balanceDue > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Balance Due:</span>
              <span>{formatCurrency(totals.balanceDue)}</span>
            </div>
          )}
          <div style={{ marginTop: '2mm' }}>
            <div>Payment Method: {billData.payment.method.toUpperCase()}</div>
            {billData.payment.transactionId && (
              <div>Transaction ID: {billData.payment.transactionId}</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '5mm' }}>
        <div>Thank you for your business!</div>
      </div>
    </div>
  );
};

export default ThermalPrintableBill;