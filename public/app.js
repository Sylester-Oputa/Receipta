const API_BASE = '/api';

// State management
let invoices = [];
let payments = [];
let receipts = [];

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load data for the tab
    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'invoices') {
        loadInvoices();
    } else if (tabName === 'payments') {
        loadPayments();
        loadInvoicesForPaymentForm();
    } else if (tabName === 'receipts') {
        loadReceipts();
    }
}

// Alert functions
function showAlert(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Invoice functions
async function loadInvoices() {
    try {
        const response = await fetch(`${API_BASE}/invoices`);
        const data = await response.json();
        invoices = data.invoices || [];
        displayInvoices();
    } catch (error) {
        console.error('Error loading invoices:', error);
        document.getElementById('invoicesList').innerHTML = '<p>Error loading invoices</p>';
    }
}

function displayInvoices() {
    const container = document.getElementById('invoicesList');
    
    if (invoices.length === 0) {
        container.innerHTML = '<p>No invoices found. Create your first invoice above!</p>';
        return;
    }
    
    container.innerHTML = invoices.map(invoice => `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">${invoice.clientName}</div>
                    <small>${invoice.clientEmail}</small>
                </div>
                <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <p><strong>Invoice ID:</strong> ${invoice.id.slice(0, 8)}...</p>
                <p><strong>Total:</strong> $${invoice.total.toFixed(2)}</p>
                <p><strong>Paid:</strong> $${invoice.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
                <p><strong>Balance:</strong> $${(invoice.total - invoice.payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p><strong>Created:</strong> ${new Date(invoice.createdAt).toLocaleString()}</p>
                ${invoice.sentAt ? `<p><strong>Sent:</strong> ${new Date(invoice.sentAt).toLocaleString()}</p>` : ''}
                ${invoice.acknowledgedAt ? `<p><strong>Acknowledged:</strong> ${new Date(invoice.acknowledgedAt).toLocaleString()}</p>` : ''}
            </div>
            <div class="card-actions">
                ${invoice.status === 'draft' ? `
                    <button class="btn btn-primary btn-small" onclick="sendInvoice('${invoice.id}')">Send Invoice</button>
                ` : ''}
                ${invoice.status === 'sent' ? `
                    <button class="btn btn-success btn-small" onclick="acknowledgeInvoice('${invoice.id}')">Mark as Acknowledged</button>
                ` : ''}
                <button class="btn btn-secondary btn-small" onclick="viewInvoiceDetails('${invoice.id}')">View Details</button>
            </div>
        </div>
    `).join('');
}

document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const unitPrice = parseFloat(row.querySelector('.item-price').value);
        
        if (description && quantity && unitPrice) {
            items.push({ description, quantity, unitPrice });
        }
    });
    
    if (items.length === 0) {
        showAlert('invoiceAlert', 'Please add at least one item', 'error');
        return;
    }
    
    const invoiceData = {
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        dueDate: document.getElementById('dueDate').value,
        items: items,
        notes: document.getElementById('notes').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });
        
        if (response.ok) {
            showAlert('invoiceAlert', 'Invoice created successfully!', 'success');
            document.getElementById('invoiceForm').reset();
            resetItems();
            loadInvoices();
        } else {
            const error = await response.json();
            showAlert('invoiceAlert', error.error || 'Failed to create invoice', 'error');
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        showAlert('invoiceAlert', 'Error creating invoice', 'error');
    }
});

async function sendInvoice(invoiceId) {
    try {
        const response = await fetch(`${API_BASE}/invoices/${invoiceId}/send`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            let message = 'Invoice sent successfully!';
            if (result.emailResult && result.emailResult.previewUrl) {
                message += ` <a href="${result.emailResult.previewUrl}" target="_blank">View Email Preview</a>`;
            }
            showAlert('invoiceAlert', message, 'success');
            loadInvoices();
        } else {
            const error = await response.json();
            showAlert('invoiceAlert', error.error || 'Failed to send invoice', 'error');
        }
    } catch (error) {
        console.error('Error sending invoice:', error);
        showAlert('invoiceAlert', 'Error sending invoice', 'error');
    }
}

async function acknowledgeInvoice(invoiceId) {
    try {
        const response = await fetch(`${API_BASE}/invoices/${invoiceId}/acknowledge`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('invoiceAlert', 'Invoice acknowledged successfully!', 'success');
            loadInvoices();
        } else {
            const error = await response.json();
            showAlert('invoiceAlert', error.error || 'Failed to acknowledge invoice', 'error');
        }
    } catch (error) {
        console.error('Error acknowledging invoice:', error);
        showAlert('invoiceAlert', 'Error acknowledging invoice', 'error');
    }
}

function viewInvoiceDetails(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    alert(`Invoice Details\n\n` +
        `ID: ${invoice.id}\n` +
        `Client: ${invoice.clientName}\n` +
        `Email: ${invoice.clientEmail}\n` +
        `Total: $${invoice.total.toFixed(2)}\n` +
        `Status: ${invoice.status}\n` +
        `Items: ${invoice.items.length}\n` +
        `Payments: ${invoice.payments.length}\n` +
        `Receipts: ${invoice.receipts.length}`
    );
}

// Item management
function addItem() {
    const container = document.getElementById('itemsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'item-row';
    newItem.innerHTML = `
        <input type="text" placeholder="Description" class="item-description" required>
        <input type="number" placeholder="Quantity" class="item-quantity" min="1" value="1" required>
        <input type="number" placeholder="Unit Price" class="item-price" step="0.01" min="0" required>
        <button type="button" class="btn btn-danger btn-small" onclick="removeItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
}

function removeItem(button) {
    const container = document.getElementById('itemsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You must have at least one item');
    }
}

function resetItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="Description" class="item-description" required>
            <input type="number" placeholder="Quantity" class="item-quantity" min="1" value="1" required>
            <input type="number" placeholder="Unit Price" class="item-price" step="0.01" min="0" required>
            <button type="button" class="btn btn-danger btn-small" onclick="removeItem(this)">Remove</button>
        </div>
    `;
}

// Payment functions
async function loadPayments() {
    try {
        const response = await fetch(`${API_BASE}/payments`);
        const data = await response.json();
        payments = data.payments || [];
        displayPayments();
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('paymentsList').innerHTML = '<p>Error loading payments</p>';
    }
}

function displayPayments() {
    const container = document.getElementById('paymentsList');
    
    if (payments.length === 0) {
        container.innerHTML = '<p>No payments recorded yet.</p>';
        return;
    }
    
    container.innerHTML = payments.map(payment => {
        const invoice = invoices.find(inv => inv.id === payment.invoiceId);
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Payment: $${payment.amount.toFixed(2)}</div>
                    <span class="status-badge ${payment.receiptGenerated ? 'status-paid' : 'status-sent'}">
                        ${payment.receiptGenerated ? 'RECEIPT GENERATED' : 'PENDING RECEIPT'}
                    </span>
                </div>
                <div class="card-body">
                    <p><strong>Payment ID:</strong> ${payment.id.slice(0, 8)}...</p>
                    <p><strong>Invoice ID:</strong> ${payment.invoiceId.slice(0, 8)}...</p>
                    ${invoice ? `<p><strong>Client:</strong> ${invoice.clientName}</p>` : ''}
                    <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
                    <p><strong>Method:</strong> ${payment.paymentMethod}</p>
                    <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
                    ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
                </div>
                <div class="card-actions">
                    ${!payment.receiptGenerated ? `
                        <button class="btn btn-success btn-small" onclick="generateReceipt('${payment.id}')">Generate Receipt</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function loadInvoicesForPaymentForm() {
    try {
        const response = await fetch(`${API_BASE}/invoices`);
        const data = await response.json();
        const select = document.getElementById('paymentInvoiceId');
        
        // Filter invoices that are not fully paid
        const unpaidInvoices = (data.invoices || []).filter(invoice => {
            const balance = invoice.total - invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            return balance > 0;
        });
        
        select.innerHTML = '<option value="">-- Select an invoice --</option>' +
            unpaidInvoices.map(invoice => 
                `<option value="${invoice.id}">${invoice.clientName} - $${invoice.total.toFixed(2)} (Balance: $${(invoice.total - invoice.payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)})</option>`
            ).join('');
    } catch (error) {
        console.error('Error loading invoices for payment form:', error);
    }
}

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const paymentData = {
        invoiceId: document.getElementById('paymentInvoiceId').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('paymentNotes').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        if (response.ok) {
            showAlert('paymentAlert', 'Payment recorded successfully!', 'success');
            document.getElementById('paymentForm').reset();
            loadPayments();
            loadInvoices();
            loadInvoicesForPaymentForm();
        } else {
            const error = await response.json();
            showAlert('paymentAlert', error.error || 'Failed to record payment', 'error');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showAlert('paymentAlert', 'Error recording payment', 'error');
    }
});

async function generateReceipt(paymentId) {
    try {
        const response = await fetch(`${API_BASE}/payments/${paymentId}/generate-receipt`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            let message = 'Receipt generated successfully!';
            if (result.emailResult && result.emailResult.previewUrl) {
                message += ` <a href="${result.emailResult.previewUrl}" target="_blank">View Email Preview</a>`;
            }
            showAlert('paymentAlert', message, 'success');
            loadPayments();
            loadReceipts();
        } else {
            const error = await response.json();
            showAlert('paymentAlert', error.error || 'Failed to generate receipt', 'error');
        }
    } catch (error) {
        console.error('Error generating receipt:', error);
        showAlert('paymentAlert', 'Error generating receipt', 'error');
    }
}

// Receipt functions
async function loadReceipts() {
    try {
        const response = await fetch(`${API_BASE}/receipts`);
        const data = await response.json();
        receipts = data.receipts || [];
        displayReceipts();
    } catch (error) {
        console.error('Error loading receipts:', error);
        document.getElementById('receiptsList').innerHTML = '<p>Error loading receipts</p>';
    }
}

function displayReceipts() {
    const container = document.getElementById('receiptsList');
    
    if (receipts.length === 0) {
        container.innerHTML = '<p>No receipts generated yet.</p>';
        return;
    }
    
    container.innerHTML = receipts.map(receipt => `
        <div class="card">
            <div class="card-header">
                <div class="card-title">Receipt ${receipt.receiptNumber}</div>
                <span class="status-badge status-paid">GENERATED</span>
            </div>
            <div class="card-body">
                <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
                <p><strong>Client:</strong> ${receipt.clientName}</p>
                <p><strong>Amount:</strong> $${receipt.amount.toFixed(2)}</p>
                <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleString()}</p>
                <p><strong>Invoice ID:</strong> ${receipt.invoiceId.slice(0, 8)}...</p>
                <p><strong>Payment ID:</strong> ${receipt.paymentId.slice(0, 8)}...</p>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="downloadReceipt('${receipt.receiptNumber}')">Download PDF</button>
            </div>
        </div>
    `).join('');
}

function downloadReceipt(receiptNumber) {
    window.open(`${API_BASE}/receipts/${receiptNumber}/download`, '_blank');
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Load all data
        const [invoicesRes, paymentsRes, receiptsRes] = await Promise.all([
            fetch(`${API_BASE}/invoices`),
            fetch(`${API_BASE}/payments`),
            fetch(`${API_BASE}/receipts`)
        ]);
        
        const invoicesData = await invoicesRes.json();
        const paymentsData = await paymentsRes.json();
        const receiptsData = await receiptsRes.json();
        
        // Update stats
        document.getElementById('totalInvoices').textContent = invoicesData.count || 0;
        document.getElementById('totalPayments').textContent = paymentsData.count || 0;
        document.getElementById('totalReceipts').textContent = receiptsData.count || 0;
        
        // Display recent activity
        displayRecentActivity(invoicesData.invoices || [], paymentsData.payments || []);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('recentActivity').innerHTML = '<p>Error loading dashboard data</p>';
    }
}

function displayRecentActivity(invoices, payments) {
    const container = document.getElementById('recentActivity');
    
    if (invoices.length === 0 && payments.length === 0) {
        container.innerHTML = '<p>No activity yet. Start by creating an invoice!</p>';
        return;
    }
    
    const recentInvoices = invoices.slice(-5).reverse();
    
    container.innerHTML = `
        <h4>Recent Invoices</h4>
        ${recentInvoices.length > 0 ? recentInvoices.map(invoice => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${invoice.clientName}</div>
                    <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
                </div>
                <div class="card-body">
                    <p><strong>Total:</strong> $${invoice.total.toFixed(2)} | <strong>Paid:</strong> $${invoice.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</p>
                    <p><strong>Created:</strong> ${new Date(invoice.createdAt).toLocaleString()}</p>
                </div>
            </div>
        `).join('') : '<p>No invoices yet</p>'}
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    
    // Set default due date to 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').valueAsDate = dueDate;
});
